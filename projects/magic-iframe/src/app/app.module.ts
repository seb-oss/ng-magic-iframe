import { BrowserModule } from '@angular/platform-browser';
import { Injector, NgModule } from '@angular/core';
import { NgMagicIframeModule } from '../../../ng-magic-iframe/src/lib/ng-magic-iframe.module';
import { NgMagicIframeComponent } from '../../../ng-magic-iframe/src/lib/components/ng-magic-iframe.component';
import { createCustomElement } from '@angular/elements';
import { WebTestComponent } from './web-test/web-test.component';


@NgModule({
  declarations: [WebTestComponent],
  imports: [
    BrowserModule,
    NgMagicIframeModule
  ],
  providers: [],
    entryComponents: [
        WebTestComponent,
        NgMagicIframeComponent
    ]
})
export class AppModule {
    constructor(private injector: Injector) {
        const el = createCustomElement(NgMagicIframeComponent, { injector });
        customElements.define('seb-magic-iframe', el);
    }
    ngDoBootstrap() {}
}
