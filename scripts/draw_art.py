"""Original deterministic vector art; no copied game assets."""
from pathlib import Path
import random
P=Path(__file__).resolve().parents[1]/'public/assets/art'
P.mkdir(parents=True,exist_ok=True)
def svg(name,body,w=1200,h=800):
 (P/(name+'.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'+body+'</svg>')
def poly(points,fill,extra=''):return f'<polygon points="{points}" fill="{fill}" {extra}/>'
def path(d,stroke,width=1,extra=''):return f'<path d="{d}" fill="none" stroke="{stroke}" stroke-width="{width}" {extra}/>'
def rect(x,y,w,h,c):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}"/>'
def text(x,y,t,size=12,c='#c2c7b4',extra=''):return f'<text x="{x}" y="{y}" font-family="monospace" font-size="{size}" fill="{c}" {extra}>{t}</text>'
def iso(x,y,z=0):return (600+(x-y)*1.04,120+(x+y)*.48-z)
def pts(coords):return ' '.join(f'{x:.1f},{y:.1f}' for x,y in coords)
def block(x,y,w,d,h,roof='#849084',left='#526964',right='#3c5554'):
 a,b,c,e=[iso(*p) for p in [(x,y),(x+w,y),(x+w,y+d),(x,y+d)]]
 at,bt,ct,et=[(p[0],p[1]-h) for p in [a,b,c,e]]
 s=poly(pts([a,b,c,e]),'#293e3e')+poly(pts([e,c,ct,et]),left)+poly(pts([b,c,ct,bt]),right)+poly(pts([at,bt,ct,et]),roof)
 for t in range(12,int(h)-5,15):
  for xx in range(8,int(w)-5,14):
   px,py=iso(x+xx,y+d,t);s+=path(f'M{px},{py} l7,3.2','#aec2af' if (xx+t)%3 else '#d4b16e',2)
  for yy in range(8,int(d)-5,14):
   px,py=iso(x+w,y+yy,t);s+=path(f'M{px},{py} l-6,3','#8aa49a',2)
 return s
rng=random.Random(19)
s=rect(0,0,1200,800,'#283f43')
for i in range(110):
 x=rng.randrange(1200);y=rng.randrange(100,790);s+=path(f'M{x},{y} l{rng.randrange(10,70)},0','#395156',1)
s+=poly('165,334 504,144 900,280 1080,430 745,713 270,634 106,485','#506661')
s+=poly('165,349 504,159 900,295 1080,445 745,728 270,649 106,500','#1c3438')
s+=poly('165,334 504,144 900,280 1080,430 745,713 270,634 106,485','#65736a')
for t in [60,155,250,345,440]:
 a=iso(t,15);b=iso(t,500);s+=path(f'M{a[0]},{a[1]} L{b[0]},{b[1]}','#a2a38b',16)+path(f'M{a[0]},{a[1]} L{b[0]},{b[1]}','#767f72',11)
 a=iso(15,t);b=iso(500,t);s+=path(f'M{a[0]},{a[1]} L{b[0]},{b[1]}','#a2a38b',16)+path(f'M{a[0]},{a[1]} L{b[0]},{b[1]}','#767f72',11)
items=[]
for x in [75,170,265,360]:
 for y in [75,170,265,360]:
  for dx,dy in [(0,0),(38,0),(0,37),(38,37)]:
   if x==265 and y==265:continue
   h=rng.choice([24,30,38,45,58,76]);items.append((x+dx,y+dy,30,28,h,rng.choice(['#a9ab92','#8e9c8e','#87998d','#a7947b','#738b81'])))
for x,y,w,d,h,c in sorted(items,key=lambda b:b[0]+b[1]):s+=block(x,y,w,d,h,c)
s+=block(271,271,69,65,38,'#b6b293','#7b8875','#617769')
s+=text(567,407,'BPD',17,'#1e3939','font-weight="bold"')
for x,y in [(30,190),(390,440),(50,350),(445,230),(270,430)]:
 px,py=iso(x,y);s+=path(f'M{px},{py} v-20','#374f42',4)+poly(f'{px-13},{py-9} {px},{py-48} {px+15},{py-9}','#435d4a')
# Waterfront warehouses and cranes.
for i in range(4):
 s+=block(390+i*30,20,23,65,18,'#a2856b','#6e7260','#495e58')
 px,py=iso(450+i*24,2)
 s+=path(f'M{px},{py} v-95 l-56,-24 M{px},{py-78} l-56,-24 M{px-35},{py-109} v75','#bba67a',4)
# Bridge and moored ships.
s+=poly('941,484 1200,623 1200,655 916,505','#c0b693')+path('M932,495 L1200,640','#626b64',19)+path('M932,495 L1200,640','#c5bc8b',1,'stroke-dasharray="9 8"')
s+=poly('725,158 864,215 897,213 871,186 751,136','#152f34')+poly('750,146 864,193 879,209 739,155','#b5ae91')+rect(812,157,35,32,'#d2c7a1')
s+=text(66,710,'BELLWETHER HARBOR',17,'#9cafa7','letter-spacing="5"')+text(68,738,'CITY SURVEY / SEPTEMBER 1991',10,'#9cafa7','letter-spacing="2"')
s+=path('M1100,80 v60 M1080,100 l20,-20 20,20','#a7b3a6',2)+text(1094,67,'N',14)
svg('city',s)
# Angular portraits, each with a distinct silhouette.
portraits=[('reyes','#b87a5b','#302e2b',0),('cole','#d1ac87','#9a9c8b',1),('park','#c7a17f','#232d2e',2),('bell','#805b47','#273032',3),('moss','#bc8b6d','#775347',4),('ford','#d9b997','#927c52',5),('mara','#c5987b','#333a36',0),('shaw','#c8ad8a','#777d6e',1)]
for name,skin,hair,i in portraits:
 s=rect(0,0,240,280,['#667b75','#778074','#78867c','#627c7d'][i%4])+poly('0,40 240,0 240,210 0,265','#263d3c','opacity=".17"')
 s+=poly('15,280 35,213 92,191 151,191 207,217 235,280','#253c42')+poly('87,185 97,225 123,240 151,214 154,179',skin)
 s+=poly('70,75 91,48 151,47 178,83 173,154 145,194 106,197 73,155',skin)
 s+=poly('125,68 160,79 173,153 145,194 124,183','#94664e','opacity=".5"')
 if i%3==0:s+=poly('65,137 61,74 87,39 151,32 185,62 187,165 169,135 161,69 117,78 80,109',hair)
 elif i%3==1:s+=poly('70,96 69,62 98,40 146,42 173,67 178,100 159,77 94,77',hair)
 else:s+=poly('66,104 66,57 98,35 164,45 182,73 171,121 154,76 98,87',hair)
 s+=path('M86,119 l22,-3 M138,116 l20,4','#3c3932',4)+poly('120,120 113,146 129,146','#9e7057')+path('M110,163 l29,-1','#694b3b',3)
 s+=poly('84,200 117,242 94,259 62,211','#456065')+poly('151,200 126,242 151,258 179,211','#3a5358')+poly('120,238 113,279 136,279 128,238','#14292f')
 s+=poly('175,237 185,240 182,252 175,258 168,250 167,240','#dfbd77')
 if i==1:s+=path('M84,139 l25,1 M137,140 l25,-1','#8f735d',2)+path('M85,109 l23,-4 M136,106 l25,4',hair,6)
 svg(name,s,240,280)
# Widescreen prologue environments.
s=rect(0,0,1600,900,'#273a40')+rect(0,520,1600,380,'#172d34')
for i in range(18):
 x=i*100-30;h=rng.randrange(120,290);s+=rect(x,520-h,85,h,'#344b4b')
 for yy in range(540-h,500,36):
  for xx in range(x+12,x+70,23):
   if rng.random()>.5:s+=rect(xx,yy,7,12,'#9a936d')
s+=poly('0,675 860,520 1600,695 1600,900 0,900','#10282e')
for x in [850,1110,1380]:s+=path(f'M{x},550 v-340 l-270,-70 M{x},295 l-270,-70 M{x-190},245 v230','#8b8f75',13)
s+=poly('150,590 730,590 665,670 200,670','#788278')+rect(240,510,160,80,'#9c9e87')+rect(270,465,75,45,'#bcc1a6')
s+=rect(0,770,1600,130,'#102229')+path('M0,756 H1600 M120,740 V900 M500,740 V900 M980,740 V900 M1420,740 V900','#5a7168',8)
svg('harbor',s,1600,900)
s=rect(0,0,1600,900,'#293a3a')+rect(90,90,810,520,'#71847b')
for x in range(105,900,160):s+=rect(x,105,130,490,'#506e70')
for y in range(130,600,40):s+=path(f'M90,{y} H900','#26393a',14)
s+=poly('980,80 1600,270 1600,900 1180,900','#1c2e31')+poly('0,640 1270,560 1600,850 1600,900 0,900','#956f50')
s+=poly('0,710 1250,628 1600,875 0,900','#695b47')+poly('710,615 1020,593 1110,668 820,700','#e5d6af')
s+=text(802,644,'CONFIDENTIAL',26,'#9b4235','transform="rotate(-4 802 644)"')
s+=path('M1015,605 l80,-250 h125','#c1b080',15)+poly('1110,295 1245,295 1300,382 1070,382','#bfa373')
s+=rect(330,590,190,50,'#203235')+poly('345,579 390,545 460,545 510,577 499,593 348,593','#142a2e')
s+=rect(1270,445,200,130,'#31484a')+text(1290,480,'BELLWETHER',17,'#bdbda1')+text(1290,510,'POLICE DEPT.',17,'#bdbda1')
svg('office',s,1600,900)
s=rect(0,0,1600,900,'#21363c')+poly('0,0 650,0 930,900 0,900','#405955')
s+=rect(870,130,520,650,'#122a30')
for i in range(8):s+=path(f'M890,{190+i*70} h470','#586e63',16)
s+=poly('150,900 260,540 415,430 605,490 760,900','#172c34')+poly('300,270 370,195 510,200 560,310 525,470 409,520 323,433','#b39374')+poly('296,340 280,244 349,176 502,182 575,249 551,344 490,250 368,282','#283c3d')
s+=poly('445,370 503,338 535,401 500,498 433,466','#172a31')+path('M488,493 q110,90 12,170 q-90,70 50,156','#10242d',10)
s+=poly('380,550 430,465 500,471 535,560 460,666','#bc9776')
svg('phone',s,1600,900)
svg('dispatch', (P/'office.svg').read_text().split('>',1)[1].rsplit('</svg>',1)[0],1600,900)
svg('badge',poly('32,2 39,16 55,13 52,30 63,41 47,48 43,63 28,56 13,62 12,46 0,36 14,25 14,9 29,15','#e5ba66')+text(19,43,'LW',20,'#172a31','font-weight="bold"'),64,64)
print('Created',len(list(P.glob('*.svg'))),'original SVG illustrations')
