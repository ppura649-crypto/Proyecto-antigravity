// Start with a small caption palette. An explicit selection is always kept as chosen.
export const ONE_SHOT_DEFAULT_FONTS=['barlow-condensed','montserrat','poppins','inter','anton'];

// One wording version pairs its on-screen words with its complete post caption.
export const ONE_SHOT_DEFAULT_WORDINGS=5;
export function oneShotWordingCount(value){const n=Math.floor(Number(value));return Number.isSafeInteger(n)&&n>0?n:ONE_SHOT_DEFAULT_WORDINGS;}
export function oneShotBatch(inputs={},value=ONE_SHOT_DEFAULT_WORDINGS){const clips=[...new Map((inputs.clips||[]).filter(c=>c.path).map(c=>[c.path,c])).values()],wordings=oneShotWordingCount(value);return {wordings,clips,total:clips.length*wordings,pending:clips.some(c=>!c.prepared)};}
