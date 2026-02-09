import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { provideMarkdown } from 'ngx-markdown';
import { SharedIconsModule } from './shared/icons/shared-icons.module';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    // provideClientHydration(),
    provideMarkdown(),
    importProvidersFrom(SharedIconsModule)
  ]
};
