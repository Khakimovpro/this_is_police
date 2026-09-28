"""Generate frozen Polza assets. Secrets only through the environment / specified dotenv file."""
import argparse, json, os, time, base64, subprocess
from pathlib import Path
import requests
ROOT = Path(__file__).resolve().parents[1]
p = argparse.ArgumentParser()
p.add_argument('--env-file'); p.add_argument('--only', choices=['voice','music','all'], default='all')
a = p.parse_args()
if a.env_file:
 for line in Path(a.env_file).read_text().splitlines():
  if '=' in line and not line.startswith('#'):
   k,v=line.split('=',1)
   if 'POLZA' in k: os.environ.setdefault(k.strip(),v.strip().strip('\"').strip("'"))
key=next((os.environ[k] for k in ['POLZA_API_KEY','POLZA_AI_API_KEY','POLZA_POISK_API_KEY','POLZA_KSR_API_KEY'] if os.environ.get(k)),None)
if not key: raise SystemExit('Set POLZA_API_KEY in a local .env file.')
s=requests.Session(); s.headers['Authorization']='Bearer '+key
out=ROOT/'public/assets/audio'; out.mkdir(parents=True,exist_ok=True)
ledger_path=ROOT/'work/initial-release/audio-generation.json'
ledger=json.loads(ledger_path.read_text()) if ledger_path.exists() else []
def save_record(record):
 ledger.append(record); ledger_path.write_text(json.dumps(ledger,ensure_ascii=False,indent=2))
def extract(data):
 if isinstance(data,dict):
  for k in ['url','audio_url']:
   if isinstance(data.get(k),str) and data[k].startswith('https://'): return ('url',data[k])
  for k in ['b64_json','audio','data']:
   v=data.get(k)
   if isinstance(v,str) and len(v)>1000: return ('base64',v)
  for v in data.values():
   if isinstance(v,(dict,list)):
    result=extract(v)
    if result:return result
 if isinstance(data,list):
  for v in data:
   result=extract(v)
   if result:return result
 return None
def finish(r,target,record):
 record['http']=r.status_code
 if not r.ok:
  record['error']=r.text[:1000];save_record(record);print(target.name,'FAILED',r.status_code,record['error'],flush=True);return False
 if 'json' not in r.headers.get('content-type',''):
  target.write_bytes(r.content)
 else:
  d=r.json()
  for _ in range(120):
   if d.get('status') not in ['pending','processing','queued','in_progress']:break
   time.sleep(5)
   d=s.get('https://polza.ai/api/v1/media/'+d['id'],timeout=45).json()
  record['usage']=d.get('usage');record['generation_id']=d.get('id')
  media=extract(d)
  if not media:
   record['error']=str(d)[:1500];save_record(record);print(target.name,'NO AUDIO',record['error'],flush=True);return False
  raw=requests.get(media[1],timeout=120).content if media[0]=='url' else base64.b64decode(media[1])
  target.write_bytes(raw)
 probe=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(target)],capture_output=True,text=True)
 if probe.returncode: raise RuntimeError('Invalid audio '+target.name)
 record['seconds']=float(probe.stdout);record['bytes']=target.stat().st_size;save_record(record)
 print(target.name,record['seconds'],'s',flush=True);return True
if a.only in ['voice','all']:
 lines=json.loads((ROOT/'public/assets/dialogue.json').read_text())
 chars=sum(len(x['en']) for x in lines)
 print('Voice forecast:',chars,'characters at 14.791 RUB/M =',round(chars*14.791/1e6,5),'RUB (catalog base rate)',flush=True)
 for line in lines:
  target=out/(line['id']+'.mp3')
  if target.exists():continue
  r=s.post('https://polza.ai/api/v1/audio/speech',json={'model':'google/gemini-3.8-flash-tts','input':line['en'],'voice':line['voice'],'response_format':'mp3'},timeout=180)
  ok=finish(r,target,{'asset':target.name,'model':'google/gemini-3.8-flash-tts','characters':len(line['en'])})
  if not ok: break
if a.only in ['music','all']:
 for name,prompt in [('night-watch','Instrumental original noir jazz soundtrack for a 1991 rainy port-city police strategy game. 72 BPM, brushed drums, warm upright bass, sparse melancholy muted trumpet, Rhodes piano, subtle tape warmth. Restrained tension and lonely late-night detective mood. No vocals. 120 seconds.'),('low-tide','Instrumental original suspense score. Slow 64 BPM, bowed double bass, sparse felt piano, muted trumpet fragments and gentle jazz brushes. Rainy industrial harbor before dawn, secrets and moral choices. Subtle cinematic tension without loud hits. No vocals. 120 seconds.')]:
  target=out/(name+'.mp3')
  if target.exists():continue
  r=s.post('https://polza.ai/api/v1/media',json={'model':'google/lyria-3-pro-preview','input':{'prompt':prompt},'async':True},timeout=120)
  finish(r,target,{'asset':target.name,'model':'google/lyria-3-pro-preview','forecast_rub':8})
