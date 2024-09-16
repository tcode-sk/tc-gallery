import { AnimationEvent } from '@angular/animations';

import { TcAnimationLifeCycleEnum } from '../enums/tc-animation.enum';

export interface TcAnimationEventInterface {
  animationEvent: AnimationEvent,
  animationLifeCycle: TcAnimationLifeCycleEnum,
}
