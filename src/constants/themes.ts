// Bubble color themes. Each theme is a 10-color palette in the same shape
// as the original Coral theme — drop-in replacement for BUBBLE_COLORS.

export interface BubbleColor {
  base: string;
  light: string;
  dark: string;
  name: string;
}

export interface Theme {
  id: string;
  label: string;
  isPro: boolean;
  description: string;
  colors: readonly BubbleColor[];
}

const CORAL: BubbleColor[] = [
  { base: '#E8A598', light: '#F4D0CB', dark: '#D4796A', name: 'Coral' },
  { base: '#98C5E8', light: '#CBE2F4', dark: '#6AABCE', name: 'Sky' },
  { base: '#A8D5A2', light: '#D0EAC9', dark: '#7ABF73', name: 'Sage' },
  { base: '#E8D098', light: '#F4E7CB', dark: '#D4B86A', name: 'Amber' },
  { base: '#C5A8E8', light: '#E2CBF4', dark: '#AB7ACE', name: 'Lavender' },
  { base: '#E8A8C5', light: '#F4CBE2', dark: '#CE7AAB', name: 'Rose' },
  { base: '#A8D5D5', light: '#CBE9E9', dark: '#7ABFBF', name: 'Teal' },
  { base: '#E8C5A8', light: '#F4E2CB', dark: '#CE9B7A', name: 'Peach' },
  { base: '#B8D5A8', light: '#D9EAD0', dark: '#8BBF7A', name: 'Mint' },
  { base: '#D5A8D5', light: '#EAD0EA', dark: '#BF7ABF', name: 'Violet' },
];

const PASTEL: BubbleColor[] = [
  { base: '#FFB5C2', light: '#FFD9DF', dark: '#E08393', name: 'Cotton candy' },
  { base: '#B5D9FF', light: '#DCEEFF', dark: '#85B5E0', name: 'Cloud' },
  { base: '#C2EBC4', light: '#E0F4E1', dark: '#8FCB91', name: 'Mint cream' },
  { base: '#FFE5B5', light: '#FFF0D6', dark: '#E0C285', name: 'Buttercup' },
  { base: '#D9C2FF', light: '#EBDDFF', dark: '#A98ECC', name: 'Lilac' },
  { base: '#FFCBD9', light: '#FFE0E8', dark: '#CC9AAA', name: 'Petal' },
  { base: '#B5EDED', light: '#D9F5F5', dark: '#85C2C2', name: 'Aqua' },
  { base: '#FFD9B5', light: '#FFE9D6', dark: '#CCA585', name: 'Peach' },
  { base: '#CCEBB5', light: '#E0F4D6', dark: '#9BC785', name: 'Spring' },
  { base: '#E5C2EB', light: '#F0DDF4', dark: '#B58CC2', name: 'Iris' },
];

const CYBERPUNK: BubbleColor[] = [
  { base: '#FF2A6D', light: '#FF85A8', dark: '#CC0044', name: 'Hot pink' },
  { base: '#05D9E8', light: '#7CECF2', dark: '#00A8B5', name: 'Cyan' },
  { base: '#D300C5', light: '#F26EE6', dark: '#A8009C', name: 'Magenta' },
  { base: '#FFD300', light: '#FFE57C', dark: '#CCA800', name: 'Neon yellow' },
  { base: '#00FF88', light: '#7CFFB8', dark: '#00CC6A', name: 'Acid green' },
  { base: '#FF6B00', light: '#FFA957', dark: '#CC5500', name: 'Inferno' },
  { base: '#9D00FF', light: '#C97CFF', dark: '#7C00CC', name: 'Ultraviolet' },
  { base: '#00B8FF', light: '#7CD9FF', dark: '#0093CC', name: 'Electric blue' },
  { base: '#FF00FF', light: '#FF7CFF', dark: '#CC00CC', name: 'Hot magenta' },
  { base: '#39FF14', light: '#9CFF7C', dark: '#2DCC10', name: 'Slime' },
];

const FOREST: BubbleColor[] = [
  { base: '#5B8C5A', light: '#A8C8A7', dark: '#3F6B3F', name: 'Pine' },
  { base: '#88B04B', light: '#C2D58C', dark: '#658637', name: 'Moss' },
  { base: '#6F4E37', light: '#B89886', dark: '#4F3725', name: 'Bark' },
  { base: '#8FBC8F', light: '#C2DBC2', dark: '#669966', name: 'Sage' },
  { base: '#D4A373', light: '#E8C9A8', dark: '#A37D54', name: 'Amber leaf' },
  { base: '#52796F', light: '#94B0A8', dark: '#39554E', name: 'Eucalyptus' },
  { base: '#C9A66B', light: '#E0C8A0', dark: '#9C7B47', name: 'Wheat' },
  { base: '#A4724B', light: '#C9A283', dark: '#7C5435', name: 'Cedar' },
  { base: '#84A98C', light: '#B8CDBC', dark: '#5E7E67', name: 'Fern' },
  { base: '#E29578', light: '#EFBFAA', dark: '#B26F55', name: 'Persimmon' },
];

const OCEAN: BubbleColor[] = [
  { base: '#0077B6', light: '#7BB8DE', dark: '#005785', name: 'Deep sea' },
  { base: '#00B4D8', light: '#7CDDF0', dark: '#0089A8', name: 'Wave' },
  { base: '#90E0EF', light: '#C7EEF6', dark: '#5DB5C7', name: 'Sky reflection' },
  { base: '#48CAE4', light: '#9DDFEC', dark: '#359AB1', name: 'Lagoon' },
  { base: '#0096C7', light: '#7CC2DC', dark: '#006D94', name: 'Bottle' },
  { base: '#03045E', light: '#7C7DAB', dark: '#020337', name: 'Midnight' },
  { base: '#48BFE3', light: '#9CDAEC', dark: '#3491AC', name: 'Tropical' },
  { base: '#5E60CE', light: '#A0A1DD', dark: '#43459C', name: 'Twilight' },
  { base: '#64DFDF', light: '#A5EBEB', dark: '#48A8A8', name: 'Mint sea' },
  { base: '#80FFDB', light: '#B3FFE6', dark: '#5DBFA4', name: 'Foam' },
];

const SUNSET: BubbleColor[] = [
  { base: '#FF6B6B', light: '#FFA5A5', dark: '#CC4848', name: 'Coral fire' },
  { base: '#FFA500', light: '#FFC966', dark: '#CC8400', name: 'Orange' },
  { base: '#FF1493', light: '#FF7AB8', dark: '#C20F70', name: 'Hot pink' },
  { base: '#FFD700', light: '#FFE757', dark: '#CCAC00', name: 'Gold' },
  { base: '#FF4500', light: '#FF8957', dark: '#CC3500', name: 'Sunset' },
  { base: '#9370DB', light: '#BFADEB', dark: '#7155B5', name: 'Twilight purple' },
  { base: '#FF69B4', light: '#FFA8D2', dark: '#CC4F8E', name: 'Pink horizon' },
  { base: '#FFB347', light: '#FFD08C', dark: '#CC8B33', name: 'Apricot' },
  { base: '#E25822', light: '#EE9676', dark: '#B33F12', name: 'Lava' },
  { base: '#8B008B', light: '#C266C2', dark: '#6B006B', name: 'Plum' },
];

export const THEMES: readonly Theme[] = [
  { id: 'coral',     label: 'Default Coral', isPro: false, description: 'Warm and balanced — the original.', colors: CORAL },
  { id: 'pastel',    label: 'Pastel Dream',  isPro: true,  description: 'Soft, dreamy hues for calm focus.',   colors: PASTEL },
  { id: 'cyberpunk', label: 'Cyberpunk',     isPro: true,  description: 'Neon synthwave — high energy.',       colors: CYBERPUNK },
  { id: 'forest',    label: 'Forest',        isPro: true,  description: 'Earthy greens and warm browns.',      colors: FOREST },
  { id: 'ocean',     label: 'Ocean',         isPro: true,  description: 'Deep blues and reef greens.',         colors: OCEAN },
  { id: 'sunset',    label: 'Sunset',        isPro: true,  description: 'Fiery warm tones at golden hour.',    colors: SUNSET },
];

export const DEFAULT_THEME_ID = 'coral';

export function getTheme(id: string): Theme {
  return THEMES.find(t => t.id === id) ?? THEMES[0];
}
