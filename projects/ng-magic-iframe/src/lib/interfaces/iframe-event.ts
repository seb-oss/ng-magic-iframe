export interface IframeEvent {
    event: IframeEventName;
    src: string;
    resource?: string;
}
export type IframeEventName = 'iframe-click'
    | 'iframe-loaded'
    | 'iframe-loaded-with-errors'
    | 'iframe-unloaded'
    | 'iframe-styles-added'
    | 'iframe-stylesheet-load'
    | 'iframe-stylesheet-loaded'
    | 'iframe-all-stylesheets-loaded'
    | 'iframe-keyup'
    | 'iframe-content-resized'
    | 'iframe-resized';
