// The prompt starts the video; the talking-head skill decides every stage and every stop.
export function talkingVideoInstructions() {
  return 'Keep my footage untouched. Edit this video with the talking-head skill: read it and the pattern for each stage and follow them, including what it says to show me before going on. Create the video in workspace/projects/<date>-talking-head-<slug> with its project.json so my workspace can follow it, and copy the delivered file to workspace/output/<that folder name>/.';
}

// The Split explainer style: its own skill, the same project folder and output contract as Classic.
export function splitVideoInstructions(skill = 'split-explainer', style = null) {
  const own = style ? ` with "style": "${style}" in its project.json beside "format": "split-explainer"` : '';
  return `Keep my footage untouched. Edit this video with the ${skill} skill: read it and its references and follow them. Use my saved look for this style; if none is saved yet, show me the looks over my own recording first and save my choice, as the skill says. Create the video in workspace/projects/<date>-${style || 'split-explainer'}-<slug>${own} so my workspace can follow it, run its steps script after each stage, and copy the delivered file to workspace/output/<that folder name>/.`;
}

export function talkingResumePrompt(project) {
  if (project.styleSkill) return `/${project.styleSkill}\nContinue ${JSON.stringify(project.path)} with the ${project.styleSkill} skill, from the stage its files show. Keep approved layers locked, and show me what the skill says to show me.`;
  return `/talking-head\nContinue ${JSON.stringify(project.path)} with the talking-head skill, from the stage its files show. Keep approved layers locked, and show me what the skill says to show me.`;
}
