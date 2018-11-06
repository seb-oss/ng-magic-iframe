import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef, EventEmitter,
    Input,
    OnDestroy, OnInit, Output,
    Renderer2,
    ViewChild
} from '@angular/core';
import {BehaviorSubject, forkJoin, fromEvent, Observable, ReplaySubject, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, map, takeUntil, tap} from 'rxjs/operators';
import {elementResizeDetectorMaker} from 'element-resize-detector';
import {IframeEvent, IframeEventName} from '../interfaces/iframe-event';

@Component({
    selector: 'seb-ng-magic-iframe',
    template: `
        <div class="seb-iframe-loading" *ngIf="$loading | async">
            <ng-content></ng-content>
        </div>
        <iframe #iframe [src]="source | safe" frameborder="0" class="w-100" [ngStyle]="$styling | async" scrolling="no"></iframe>
    `,
    styles: [`
        :host {
            position: relative;
            display: block;
            overflow: hidden;
        }
        iframe {
            overflow: hidden
        }
        .seb-iframe-loading {
            height: 100%;
            width: 100%;
            position: absolute;
            z-index: 1;
        }
        .seb-iframe-loading::after {
            background: #fff;
            content: '';
            display: block;
            height: 100%;
            position: absolute;
            top: 0;
            width: 100%;
            z-index: -1;
            left: 0;
        }
    `]
})
export class NgMagicIframeComponent implements OnInit, AfterViewInit, OnDestroy {
    get resizeDebounceMillis(): number {
        return this._resizeDebounceMillis;
    }

    @Input() set resizeDebounceMillis(value: number) {
        this._resizeDebounceMillis = value;
        this.$styling = this.$bodyHeight.pipe(
            distinctUntilChanged(),
            debounceTime(this.resizeDebounceMillis),
            tap(val => this.emitEvent('iframe-resized')),
            map((height) => ({'height.px': height})));
    }
    get autoResize(): boolean {
        return this._autoResize;
    }

    @Input() set autoResize(value: boolean) {
        this._autoResize = value;
    }
    get styleUrls(): Array<string> {
        return this._styleUrls;
    }

    @Input() set styleUrls(value: Array<string>) {
        this._styleUrls = value;
    }
    get styles(): string {
        return this._styles;
    }

    @Input() set styles(value: string) {
        this._styles = value;
    }
    get source(): string {
        return this._source;
    }

    @Input() set source(value: string) {
        this._source = value;
    }

    @Output() iframeEvent: EventEmitter<IframeEvent> = new EventEmitter();

    $iframeClick: ReplaySubject<MouseEvent> = new ReplaySubject<MouseEvent>(1);
    $iframeKeyUp: ReplaySubject<KeyboardEvent> = new ReplaySubject<KeyboardEvent>(1);
    $iframeUnload: ReplaySubject<BeforeUnloadEvent> = new ReplaySubject<BeforeUnloadEvent>(1);
    $loading: BehaviorSubject<boolean> = new BehaviorSubject(true);
    $styling: Observable<any>;
    iframeDocument: Document;
    iframeBody: HTMLElement;
    activeSource: string;
    elementResizeDetector: elementResizeDetectorMaker.Erd;
    private eventListeners: Array<any> = [];
    private $unsubscribe = new Subject();
    @ViewChild('iframe') elementRef: ElementRef;
    private _source: string;
    private _styles: string;
    private $bodyHeight: Subject<number> = new Subject<number>();
    private _styleUrls: Array<string>;
    private _autoResize = true;
    private _resizeDebounceMillis = 50;
    constructor(private renderer: Renderer2, private cdr: ChangeDetectorRef) {}

    private addStyleSheets(styleUrls) {
        if (styleUrls.length > 0) {

            // create placeholder for subjects
            const loadSubjects: Array<Subject<string>> = [];

            // loop through all style sheets...
            styleUrls.map((styleUrl: string) => {

                // create link element
                const linkElement: HTMLElement  = this.iframeDocument.createElement('link');
                linkElement['rel'] = 'stylesheet';
                linkElement['type'] = 'text/css';
                linkElement['href'] = styleUrl;

                // create load subject that will emit once the stylesheet has loaded
                const loadSubject: Subject<string> = new Subject<string>();
                loadSubjects.push(loadSubject);

                // listen to load event on link
                const stylesheetLoadListener = this.renderer.listen(linkElement, 'load', (test: Event) => {
                    this.iframeBody.style.overflow = 'inherit';
                    this.emitEvent('iframe-stylesheet-loaded', styleUrl);
                    loadSubject.next(styleUrl);
                    loadSubject.complete();
                    return true;
                });

                // push listener to array so that we can remove them later
                this.eventListeners.push(stylesheetLoadListener);

                // add link to iframe head
                this.iframeDocument.head.appendChild(linkElement);

                // emit load event
                this.emitEvent('iframe-stylesheet-load', styleUrl);
            });

            forkJoin(loadSubjects)
                .pipe(
                    takeUntil(this.$unsubscribe)
                )
                .subscribe(res => {
                    if (styleUrls.length > 1) {
                        this.emitEvent('iframe-all-stylesheets-loaded', styleUrls);
                    }
                    this.$loading.next(false);
                });
        }
    }

    private addCss(styles: string) {
        const styleElement = this.iframeDocument.createElement('style');
        styleElement.appendChild(this.iframeDocument.createTextNode(styles));
        this.iframeDocument.getElementsByTagName('head')[0].appendChild(styleElement);
        this.emitEvent('iframe-styles-added');
    }

    private addElementResizeDetector(body: HTMLElement, style: any) {
        this.elementResizeDetector = elementResizeDetectorMaker({strategy: 'scroll'});
        this.elementResizeDetector.listenTo(body, () => {
            const offsetHeight = body.offsetHeight;
            const marginTop = parseInt(style.getPropertyValue('margin-top'), 10);
            const marginBottom = parseInt(style.getPropertyValue('margin-bottom'), 10);
            const height = offsetHeight + marginTop + marginBottom;
            this.$bodyHeight.next(height);
        });
    }

    private removeElementResizeDetector() {
        if (this.iframeBody && this.elementResizeDetector) {
            this.elementResizeDetector.uninstall(this.iframeBody);
        }
    }

    private emitEvent(eventName: IframeEventName, resource?: string) {
        const iframeEvent: IframeEvent = { event: eventName, src: this.activeSource};
        if (resource) {
            iframeEvent.resource = resource;
        }
        this.iframeEvent.emit(iframeEvent);
    }

    reload() {
        if (this.iframeDocument && this.iframeDocument.location) {
            this.iframeDocument.location.reload();
        }
    }

    ngOnInit() {
        this.activeSource = this.source;
        this.$loading.pipe(
            filter(value => value === false),
            takeUntil(this.$unsubscribe)
        ).subscribe((res) => {
            this.emitEvent('iframe-loaded');
        });
    }

    ngAfterViewInit() {
        const iframe = this.elementRef.nativeElement;
        this.$iframeClick
            .pipe(
                takeUntil(this.$unsubscribe)
            ).subscribe((res) => {
            this.emitEvent('iframe-click');
        });
        this.$iframeKeyUp
            .pipe(
                takeUntil(this.$unsubscribe)
            ).subscribe((res) => {
            this.emitEvent('iframe-keyup');
        });
        this.$iframeUnload
            .pipe(
                takeUntil(this.$unsubscribe)
            ).subscribe((res) => {
            this.$loading.next(true);
            this.emitEvent('iframe-unloaded');
            this.iframeBody.style.overflow = 'hidden';
            this.cdr.detectChanges();
        });

        fromEvent(iframe, 'load')
            .pipe(
                takeUntil(this.$unsubscribe)
            )
            .subscribe((res) => {
                this.activeSource = iframe.contentDocument.location.href;

                // declare iframe document and body
                this.iframeDocument = iframe.contentDocument;
                this.iframeBody = this.iframeDocument.body;

                // add inline css
                if (this.styles) {
                    this.addCss(this.styles);
                }

                // add external stylesheets
                if (this.styleUrls && this.styleUrls.length > 0) {
                    this.addStyleSheets(this.styleUrls);
                } else {
                    this.$loading.next(false);
                }

                // add element resize detector
                if (this.autoResize) {
                    this.addElementResizeDetector(this.iframeBody, iframe.contentWindow.getComputedStyle(this.iframeBody));
                }

                // add click listener
                const clickListener = this.renderer.listen(
                    iframe.contentWindow,
                    'click',
                    ($event: MouseEvent) => this.$iframeClick.next($event)
                );
                this.eventListeners.push(clickListener);

                // add key up listener
                const keyUpListener = this.renderer.listen(
                    iframe.contentWindow,
                    'keyup',
                    ($event: KeyboardEvent) => this.$iframeKeyUp.next($event)
                );
                this.eventListeners.push(keyUpListener);

                // add unload listener
                const unloadListener = this.renderer.listen(
                    iframe.contentWindow,
                    'beforeunload',
                    ($event: BeforeUnloadEvent) => this.$iframeUnload.next($event)
                );
                this.eventListeners.push(unloadListener);
                // console.log('iframe loaded');
            });
    }

    ngOnDestroy(): void {
        this.$unsubscribe.next();
        this.$unsubscribe.complete();

        // detach event listeners
        this.eventListeners.map((listener) => listener());

        // if auto resize...
        if (this.autoResize) {
            // ...try and remove element resize detector
            this.removeElementResizeDetector();
        }
    }

}
