import { AnimationEvent } from '@angular/animations';

import { AnimationLifeCycleEnum } from '../enums/animation.enum';

export interface AnimationEventInterface {
  animationEvent: AnimationEvent,
  animationLifeCycle: AnimationLifeCycleEnum,
}
