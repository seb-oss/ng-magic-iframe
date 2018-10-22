# SEB Magic Iframe
[![Build Status](https://travis-ci.com/sebgroup/ng-magic-iframe.svg?token=tzrdkWGEu776AVobzRhp&branch=master)](https://travis-ci.com/sebgroup/ng-magic-iframe)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

## Install with npm
```
npm install @sebgroup/ng-magic-iframe --save
```

## Add to app.modules
```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { NgMagicIframeModule } from '../../projects/ng-magic-iframe/src/lib/ng-magic-iframe.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    NgMagicIframeModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

## Usage
### Basic
```html
<seb-ng-magic-iframe [source]="'/assets/first-page.html'"></seb-ng-magic-iframe>
```

### Advanced
```html
<seb-ng-magic-iframe [source]="'/assets/first-page.html'"
                     [styles]="'body { background: white; }'"
                     [styleUrls]="['/assets/css/external-stylesheet.css', '/assets/css/fonts.css']"
                     [autoResize]="false"
                     [resizeDebounceMillis]="0"
                     (iframeEvent)="foo($event)">
                     <!-- PLACEHOLDER FOR LOADING CONTENT -->
</seb-ng-magic-iframe>
```

## Configuration and options
### @Inputs
|@Input|Description|Default|
|:-----|:-----------|:-------------------|
|source| Path to iframe content source.| n/a |
|styles| Apply/inject inline styles to the iframe (Optional).| n/a |
|styleUrls| Add one or more stylesheets to the iframe, note that the iframe won't be visible until they've loaded (Optional).| n/a |
|autoResize| Auto resize the iframe when the inner content changes height (Optional).| true |
|resizeDebounceMillis| Debounce time in milliseconds for resize event to prevent race condition (Optional).| 50 |

### @Outputs
|@Output|Description|
|:-----|:-----------|
|iframeEvent| Listen for state changes in iframe, see list of events below.|

### Iframe events
|@Input                           |Description|
|:--------------------------------|:-----------|
| iframe-click                    | Event emitted when element inside iframe has been clicked.
| iframe-keyup                    | Event emitted when keyup event emitted inside iframe.
| iframe-unloaded                 | Event emitted when iframe triggers unload event (url in iframe changes).
| iframe-styles-added             | Emitted when styles have been added.
| iframe-stylesheet-load          | Emitted when external stylesheets start loading.
| iframe-stylesheet-loaded        | Emitted when external stylesheets have finished loading.
| iframe-all-stylesheets-loaded   | Emitted when all external stylesheets have finished loading (only emitted if more than one external stylesheets).
| iframe-loaded                   | Emitted when iframe have finished loading (including optional styles and/or stylesheets).
| iframe-resized                  | Emitted when the iframe changes size.

### Custom content loader
SEB Magic iframe uses content projection together with ng-content to show custom content while the iframe is loading. Simply add your own component or markup like this:
```html
<seb-ng-magic-iframe [source]="'/assets/first-page.html'">
  <div class="skeleton-loader"></div> <!-- replace with your own code -->
</seb-ng-magic-iframe>
```


## Run locally

* Clone the repository
* Run `npm install`
* Run `npm start` and navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.
