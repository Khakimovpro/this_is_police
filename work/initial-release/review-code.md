# Code review — wave 1

1. Late training/investigation could end after the 720-minute engine cap and permanently block the campaign. Corrected: both advancement and save loader accept 750 minutes; latest legitimate job completes at 749. Test covers two job types, save/reload at 720, completion and next shift.
2. Full app refresh reset scrolling and keyboard focus each second. Corrected: render preserves panel scroll and active action identity, resetting dossier scroll only when its tab changes. Browser regression added.
3. Ending narration lacked its exact English text and Russian subtitle. Corrected: epilogues render the same dialogue record used for voice playback. All four endings checked in browser.

# Wave 2

Previous fixes confirmed. One additional normal-path issue reproduced with delayed dialogue.json: resuming an ending could play voice before subtitles arrived. Corrected: game entry and intro now await the dialogue request before opening narrated content. Browser test delays the clean-ending text response by 2 seconds. No third review wave; direct regression checks rerun.
