export const templates = {
  birthday: {
    filter: 'eq=saturation=1.55:contrast=1.08:brightness=.06,colorbalance=rs=.12:gs=.03:bs=-.05,vignette=PI/5',
    transition: 'fade', musicVolume: .72, intro: .45, outro: .7, fadeColor: 'white',
  },
  travel: {
    filter: 'eq=saturation=1.35:contrast=1.12,colorbalance=rs=-.04:gs=.06:bs=.12,unsharp=5:5:.7',
    transition: 'smoothleft', musicVolume: .68, intro: .35, outro: .55, fadeColor: 'white',
  },
  cinematic: {
    filter: 'eq=saturation=.62:contrast=1.28:brightness=-.07,colorbalance=rs=.08:gs=-.03:bs=.1,vignette=PI/3',
    transition: 'fadeblack', musicVolume: .64, intro: 1.1, outro: 1.2, fadeColor: 'black',
  },
  romantic: {
    filter: 'eq=saturation=.88:contrast=.92:brightness=.1,colorbalance=rs=.16:gs=-.04:bs=.08,gblur=sigma=.35',
    transition: 'fade', musicVolume: .58, intro: .9, outro: 1, fadeColor: 'white',
  },
  festival: {
    filter: 'eq=saturation=1.65:contrast=1.18,hue=h=8*sin(2*PI*t/3),vignette=PI/4',
    transition: 'circleopen', musicVolume: .78, intro: .25, outro: .45, fadeColor: 'purple',
  },
  motivation: {
    filter: 'eq=saturation=1.18:contrast=1.38:brightness=-.03,unsharp=7:7:1.15,vignette=PI/4',
    transition: 'wipeup', musicVolume: .7, intro: .2, outro: .5, fadeColor: 'black',
  },
  friendship: {
    filter: 'curves=preset=vintage,eq=saturation=1.22:brightness=.07,colorbalance=rs=.1:gs=.05:bs=-.08',
    transition: 'smoothright', musicVolume: .65, intro: .55, outro: .75, fadeColor: 'white',
  },
  minimal: {
    filter: 'eq=saturation=.18:contrast=1.04:brightness=.05',
    transition: 'fade', musicVolume: .52, intro: .7, outro: .8, fadeColor: 'white',
  },
};
