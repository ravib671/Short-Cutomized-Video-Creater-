const supportedAnimations = new Set(['none', 'slow-zoom', 'pan', 'drift']);

export function animationFilters(value, size, duration) {
  const animation = supportedAnimations.has(value) ? value : 'none';
  const [width, height] = size.split(':').map(Number);
  const seconds = Math.max(.1, Number(duration) || .1);

  if (animation === 'slow-zoom') {
    return [
      'fps=30',
      `zoompan=z='min(zoom+0.0008,1.1)':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=${width}x${height}:fps=30`,
    ];
  }
  if (animation === 'pan') {
    return [
      'scale=ceil(iw*1.08/2)*2:ceil(ih*1.08/2)*2',
      `crop=${width}:${height}:x='(in_w-out_w)*min(t/${seconds},1)':y='(in_h-out_h)/2'`,
    ];
  }
  if (animation === 'drift') {
    return [
      'scale=ceil(iw*1.08/2)*2:ceil(ih*1.08/2)*2',
      `crop=${width}:${height}:x='(in_w-out_w)/2*(1+sin(t*0.8))':y='(in_h-out_h)/2*(1+cos(t*0.55))'`,
    ];
  }
  return [];
}
