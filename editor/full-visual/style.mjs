// The shared editor stores font ids; the native caption measures CSS family names.
const FAMILIES = { inter: 'Inter', poppins: 'Poppins', sora: 'Sora', montserrat: 'Montserrat', anton: 'Anton', bebas: 'Bebas Neue', oswald: 'Oswald', playfair: 'Playfair Display', dmserif: 'DM Serif Display', marker: 'Permanent Marker' };
export const captionFamily = (font) => FAMILIES[font] ?? font;
export const captionStyleControls = ['font', 'size', 'color', 'activeColor', 'caps', 'maxWidth', 'y'];
