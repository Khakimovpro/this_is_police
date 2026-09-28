const root = import.meta.env.BASE_URL + "assets/audio/";
let settings = { music: 0.35, effects: 0.6, voice: 0.9 };
try {
  settings = {
    ...settings,
    ...JSON.parse(localStorage.getItem("low-water-audio") || "{}"),
  };
} catch {}
let music = null,
  voice = null,
  enabled = false;
const effects = new Set();
function play(a) {
  return a.play().catch(() => {});
}
export const sound = {
  get settings() {
    return settings;
  },
  unlock() {
    enabled = true;
    this.music();
  },
  music(track = "night-watch") {
    if (!enabled) return;
    if (music?.dataset.track === track) {
      if (music.paused) play(music);
      return;
    }
    music?.pause();
    music = new Audio(root + track + ".mp3");
    music.dataset.track = track;
    music.loop = true;
    music.volume = settings.music * 0.5;
    play(music);
  },
  fx(name) {
    if (!enabled || !settings.effects) return;
    const a = new Audio(root + name + (name === "siren" ? ".wav" : ".mp3"));
    a.volume = settings.effects * 0.65;
    effects.add(a);
    a.onended = () => effects.delete(a);
    a.onerror = () => effects.delete(a);
    play(a);
  },
  speak(id, ended) {
    voice?.pause();
    voice = new Audio(root + id + ".mp3");
    voice.volume = settings.voice;
    if (music) music.volume = settings.music * 0.15;
    const done = () => {
      if (music) music.volume = settings.music * 0.5;
      ended?.();
    };
    voice.onended = done;
    voice.onerror = done;
    play(voice);
    return voice;
  },
  stopVoice() {
    if (voice) {
      voice.pause();
      voice.onended = null;
      voice = null;
    }
    if (music) music.volume = settings.music * 0.5;
  },
  set(key, value) {
    settings[key] = Math.max(0, Math.min(1, value));
    try {
      localStorage.setItem("low-water-audio", JSON.stringify(settings));
    } catch {}
    if (music)
      music.volume = settings.music * (voice && !voice.paused ? 0.15 : 0.5);
    if (voice) voice.volume = settings.voice;
  },
  suspend() {
    music?.pause();
    voice?.pause();
    effects.forEach((a) => a.pause());
  },
  resume() {
    if (enabled) {
      if (music) play(music);
      if (voice && voice.currentTime > 0 && !voice.ended) play(voice);
    }
  },
};
