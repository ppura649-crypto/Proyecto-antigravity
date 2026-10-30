// The faces a buyer can pick for words they add by hand and for captions. Few on purpose, each with a job: plain,
// round, geometric, tall, condensed, serif, handwritten. A pack's own looks keep the fonts that pack loads.
import { loadFont as inter } from '@remotion/google-fonts/Inter';
import { loadFont as poppins } from '@remotion/google-fonts/Poppins';
import { loadFont as sora } from '@remotion/google-fonts/Sora';
import { loadFont as montserrat } from '@remotion/google-fonts/Montserrat';
import { loadFont as anton } from '@remotion/google-fonts/Anton';
import { loadFont as bebas } from '@remotion/google-fonts/BebasNeue';
import { loadFont as oswald } from '@remotion/google-fonts/Oswald';
import { loadFont as playfair } from '@remotion/google-fonts/PlayfairDisplay';
import { loadFont as dmSerif } from '@remotion/google-fonts/DMSerifDisplay';
import { loadFont as marker } from '@remotion/google-fonts/PermanentMarker';

const latin = { subsets: ['latin'] } as const;
const face = (id: string, label: string, load: any, weights: string[]) => ({ id, label, weights: weights.map(Number), family: load('normal', { weights, ...latin }).fontFamily as string });

export const FONTS = [
  face('inter', 'Inter', inter, ['500', '700', '800', '900']),
  face('poppins', 'Poppins', poppins, ['500', '700', '800', '900']),
  face('sora', 'Sora', sora, ['600', '700', '800']),
  face('montserrat', 'Montserrat', montserrat, ['600', '800', '900']),
  face('anton', 'Anton', anton, ['400']),
  face('bebas', 'Bebas Neue', bebas, ['400']),
  face('oswald', 'Oswald', oswald, ['500', '700']),
  face('playfair', 'Playfair', playfair, ['500', '700', '900']),
  face('dmserif', 'DM Serif', dmSerif, ['400']),
  face('marker', 'Marker', marker, ['400']),
];

export const fontById = (id?: string) => {
  if (!id) return FONTS[0];
  const key = id.toLowerCase().replace(/["']/g, '');
  return FONTS.find((f) => [f.id, f.label.toLowerCase(), f.family.toLowerCase().replace(/["']/g, '')].includes(key))
    ?? { id, label: id, family: id, weights: [400, 500, 600, 700, 800, 900] };
};

export function fontStack(id?: string) {
  return `${fontById(id).family}, "Helvetica Neue", Arial, sans-serif`;
}

// The nearest weight the face has, so a style written for one face still draws in another.
export function nearestWeight(id: string | undefined, weight: number | undefined) {
  const weights = fontById(id).weights;
  const want = weight ?? 700;
  return weights.reduce((best, w) => (Math.abs(w - want) < Math.abs(best - want) ? w : best), weights[0]);
}
