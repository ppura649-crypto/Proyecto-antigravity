import { createHash } from 'node:crypto';

// Discovery is account-wide. A study belongs to one identified format.
export const trialStudyTaskId = formatId => 'trial-study-' + createHash('sha256').update(String(formatId)).digest('hex').slice(0, 12);
