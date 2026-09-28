# Test review — wave 1

1. Browser test did not observe running time, crew return or actual payment. Corrected: real browser timer at 3× advances a dispatched crew to completion; persisted cash and released officers are asserted.
2. Intro smoke checked only its container. Corrected: real HTMLAudioElement playback is observed for voice and music; Cyrillic subtitles are asserted.

Additional reviewer-discovered game regressions now covered: last-minute long jobs after save/reload, preservation of scrolling and focus across clock ticks, exact subtitles in all four endings.

# Wave 2

Previous two gaps confirmed closed. Reviewer identified that loading at exactly minute 720 did not protect the expanded save range. Changed the regression to save/load at minute 748, finish at 749, and proceed to the next shift for both long job types. Final browser test also covers a deliberately delayed dialogue response. Direct checks rerun; no third review wave.
