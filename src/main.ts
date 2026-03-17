import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Configure zone.js to use passive event listeners for wheel events
(window as any).__zone_symbol__PASSIVE_EVENTS = ['scroll', 'wheel', 'mousewheel', 'touchstart', 'touchmove'];

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
