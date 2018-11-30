import { NgModule } from '@angular/core';
import { NgMagicIframeComponent } from './components/ng-magic-iframe.component';
import { SafePipe } from './pipes/safe.pipe';
import { CommonModule } from '@angular/common';
import { PushPipe } from './pipes/push.pipe';

@NgModule({
  imports: [CommonModule],
  declarations: [NgMagicIframeComponent, SafePipe, PushPipe],
  exports: [NgMagicIframeComponent]
})
export class NgMagicIframeModule { }
