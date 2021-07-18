# NgxImageengine

An Angular(12) component to easily integrate ImageEngine CDN distribution functionality into your assets.

This components provides an easy way to bind an object representing a set of [ImageEngine directives](https://support.imageengine.io/hc/en-us/articles/360058880672-directives) to your assets in order to take advantage of ImageEngine's advanced optimizations, allowing for exact-pixel dimensions requests for your image assets, resulting in highly optimized resource delivery.

Besides that it has bindings to enable lazy loading of off-screen images, reloading of `src`'s on device width changes, prevent [Cumulative Layout Shift](https://web.dev/optimize-cls/), sourcing the minimal desired sizes, and fit, for your images based entirely on CSS/styling properties that you can control without needing to fiddle with other properties.


It's available on npm. Install with:

`npm install ngx-imageengine-image`

## Index:

[Usage](#usage)
<br/>
[Inputs](#accepted-inputs)
<br/>
[Directives](#directives)
<br/>
[Path](#path)
<br/>
[Host](#host)
<br/>
[Alt](#alt)
<br/>
[Wrapper and Image Classes](#wrapper_classes--image_classes)
<br/>
[Wrapper and Image Style](#wrapper_styles--image_styles)
<br/>
[Responsiveness](#responsive)
<br/>
[Derive Size from Wrapper](#derive_size)
<br/>
[Lazy loading](#lazy)
<br/>
[Remove string from path](#strip_from_src)
<br/>
[Debug](#debug)
<br/>
[Relative Sizes and derive_size](#relative-sizing-and-derive_size)

### Usage

Import the ImageEngine component on your module file, and add it to `@NgModule` declaration as an import:

```js
import { NgxImageengineModule } from "ngx-imageengine-image";`

@NgModule({
    declarations: [...],
    imports: [
    	...,
	NgxImageengineModule
    ],
    ...
})
```

Now use the component from anywhere on your app:

```html
<lib-ngx-imageengine
	[wrapper_styles]="{width: '250px', height: '250px', borderRadius: '50%'}"
	[derive_size]="true"
	[path]="some_element.image_path"
	[alt]="some_element.description"
	[directives]="{fit: "cropbox", sharpness: 10, compression: 10, format: 'jpg'}"
	[lazy]="false"
	host="https://your-image-engine-distribution-url.imgeng.io"
	></lib-ngx-imageengine>
```

Structure of the generate html markup:

```html
<div class="ngx-ie-image-wrapper"
     [ngClass]="wrapper_classes"
     [ngStyle]="wrapper_styles">
     
	   <img *ngIf="ready"
	   	class="ngx-ie-image"
		[ngClass]="image_classes"
		[ngStyle]="image_styles"
		[alt]="alt"
		/>
</div>
```

Notice that `ngx-ie-image-wrapper` class has a base styling:

```css
.ngx-ie-image-wrapper {
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
```

This is so that the component works and displays correctly the images according to their fit type and sizes, even when not using the ImageEngine CDN.



### Accepted Inputs:

```js
@Input() directives: IEDirectives = {};
    
@Input() path: string | null = null;
@Input() host: string | null = "";
    
@Input() alt: string | null = "";
@Input() wrapper_classes: string[] | Set<string> | { [klass: string]: any } = {};
@Input() wrapper_styles: { [klass: string]: any } | null = null;
@Input() image_classes: string[] | Set<string> | { [klass: string]: any }  = {};
@Input() image_styles: { [klass: string]: any } | null = null;

@Input() responsive: boolean = false;
@Input() derive_size: boolean = false;
@Input() lazy: boolean = true;

@Input() strip_from_src: string = "";

@Input() debug: boolean = false;
```

#### directives
An object specifying the ImageEngine directives to use for this image.

```js
export type IEFormat =
    "png"  |
    "gif"  |
    "jpg"  |
    "bmp"  |
    "webp" |
    "jp2"  |
    "svg"  |
    "mp4"  |
    "jxr"  |
    "avif" ;


export type IEFit =
    "stretch"   |
    "box"       |
    "letterbox" |
    "cropbox"   ;


export interface IEDirectives {
    width?: number;                // the intrinsic width of the final image 
    height?: number;               // the intrinsic height of the final image
    auto_width_fallback?: number;  // if WURFL device detection should be tried with a
                                   // fallback value in case it fails

    scale_to_screen_width?: number;          // 0-100 float
    crop?: [number, number, number, number]; // [width, height, left, top]

    format?: IEFormat;  // the output format
    fit?: IEFit;        // the image fit in relation to the provided width/height

    compression?: number; // 0-100
    sharpness?: number;   // 0-100
    rotate?: number;      // -360-360

    inline?: true;                 // convert image to dataURL
    keep_meta?: true;              // keep EXIF image data
    no_optimization?: true;        // don't apply IE optimizations
};
```

#### path
The path without the host part. Will raise if not set at instatiation.

#### host
Usually the host of your ImageEngine distribution.
Can be left blank/null, in which case it's coerced to an empty string `""`, when empty the final source of the asset will be the path alone (so you can use relative paths when developing)

The final url will be of the form `${host}${path}${ie_directives_query_string}`

#### alt
Set the `alt` property of the `img` element that will be rendered.

#### wrapper_classes & image_classes
Classes to apply to the wrapper element and inner `img` element.

#### wrapper_styles & image_styles
Styles to apply to the wrapper element and inner `img` element.

#### responsive
If the component should decide to re-compute the final url on window resize events. Defaults to `false`. When `true`, in case of a window resize the component will re-evaluate it's properties and rebuild the url, in case it can determine the new resulting size would be bigger than before.

This is usually used along with the property `derive_size` as `true`, and classes/styling that make the wrapper be a given dimension, since that makes the component decide on `width` and `height` based on the effective styled dimensions of the wrapper.

An example would be passing a `wrapper_classes` with a class `"my-thumbnail-holder"`, having that class define its width and height in different breakpoints, and setting `responsive` and `derive_size` as `true`. Now if a visiting user switched the orientation of their device (or resized the window), and the class applied different sizes according to breakpoints, then the component would re-compute it's values and in case a bigger image would be needed it would change the url directives to match that - while if the new sizes were smaller, it would not.

#### derive_size
This flag defaults to `false` because its behaviour changes how you normally specify image dimensions in many other libraries. It is nonetheless the way the component is intended to be used in most real case scenarios.

Usually with other libraries that rely on image transformations, you do some calculations or define the width and height of the image you want and then the library sets the container to that to match the final image and prevent Cumulative Layout Shift. You probably also have that element in a container under your control that you might style accordingly. This works but introduces a hard dependency on the codebase - the styling is one aspect (might be on CSS files, or inline styles, etc), the actual sizing of the asset is another (usually defined in JS), and changing one or other, or something that affects one or other, requires changing the other parts as well.

But if you can style the wrapper in a single point/way and then have the image inside of it automatically derive its own size properties from that wrapper, it means any change in styling or code, only needs to change in that single place.

As an example, lets say that we have this CSS:

```css
.faq-thumbnail-img {
  width: 200px;
  height: 150px;
}

@media screen and (max-width: 600px) {
  .faq-thumbnail-img {
    width: 100px;
    height: 75px;
  }
}
```

And now you want to use a component:

```html
<lib-ngx-imageengine
	[wrapper_classes]="['faq-thumbnail-img']"
	[derive_size]="true"
	[path]="some_element.image_path"
	[directives]="{fit: "cropbox"}"
	host="https://your-image-engine-distribution-url.imgeng.io"
	></lib-ngx-imageengine>
```

What this does is that the component will render the `wrapper` with the class `faq-thumbnail-img`, which in turn will force its styling rules to be applied.
When the component is being prepared for render it will read the wrapper sizing and see that the `width` is `200px` and `height` `150px` (let's say we open the page in desktop version).

Now it can derive from that that the image will need to fit that rectangle so it can build the width and height directives by itself to assemble the url for ImageEngine.

If the page was opened in mobile (or anything less than 600px), then the dimensions it would derive would be those on the media query we defined (100px x 75px).

If we had hardcoded instead the `width` and `height` as directives, if we decided to change the layout for some reason, we would need to change it in our components declarations, and in our CSS and make sure they'd play ball. On the other hand, if we use `derive_size` then we can control all of that simply through the styling of the element and the sizes requested to ImageEngine will always be precise to the single pixel.

This is also the reason why there's no `srcset` options on the component - it's easier to define class/styling responsiveness and just take advantage of the `derive_size` to request exactly the sizes that will fit perfectly the container where the image will be placed.

Using classes to define the wrapper size also means that Cumulative Layout Shift doesn't happen, since the wrapper will hold its dimensions and when the image is rendered, it will be inside that wrapper without changing its dimensions.

It's also possible to use relative sizes on the elements styling and derive the image dimensions from that, but this has some caveats explained at the end of this section.

The key takeaway is that, if you organise your image assets in this way you can do entire styling changes to your layouts without worrying with fixing and changing your `ngx` components. If the rendered size of your card would make the `ngx-ie-image-wrapper` have width of `150px` and `height` of `100px` the directives added to the src url would be `/w_150/h_100`. 

This also means that if you pass `derive_size`, and in the `directives` input `width` and `height` those in the directives will have no bearing as they'll be overwritten, it will also override the `no_optimization` directive, since that directive requests an image as it is in the original source, meaning ImageEngine won't serve any optimized version - which conflicts with you telling the component to `derive_size` as that implies you want a specific size.


#### lazy
This flag makes it so that the component will only render the `img` element inside the wrapper if the component is in the viewport, or when the component is scrolled into the viewport.
This flag has no knowledge of other visibility styles or the way you architect your layout, so if you have hidden sections, popups, or tabs that aren't visible but appear in a dom node that can fall in the viewport (and just be stylistically hidden through overflow or such) it might still request the image immediately (most of the times this won't happen as the dimensions and position are computed as offscreen, but a caveat to take notice in case you see it happening).

#### strip_from_src
You can set this input to a string that will remove the occurrence of that string from the provided path. This is just a helper when your image src's include their host and you don't want to replace them by yourself.

#### debug
This flag enables some debugging information (computed final directives that were used to build the ImageEngine query url), and possible warnings to output to the console.

<br/>


#### Relative sizing and derive_size

Due to the way browsers compute the CSS rules and height of elements using `derive_size` with relative dimensions is a bit more tricky.
Dimensions require that somewhere along the dom hierarchy an element has an absolute width/height value set. If all your ellements are sized relatively, and/or only `max-height` or `min-height` use absolute values returning the dimensions of the wrapper element results in 0. Which in turn makes ImageEngine ignore those values (and if it didn't both your element and the image would have zero as their dimensions, which is non-sensical).

What this means is that in practice you'll need to add/have two things defined for it to work. Setting the height on an element in the parent hierarchy and setting the style of the `lib-ngx-imageengine` component itself.


```html
<div class="card-element" style="height: 500px">
    <lib-ngx-imageengine [wrapper_styles]="{width: '50%', height: '100%'}"
    			 [derive_size]="true"
			 [path]="image_path'"
			 [directives]="{format: 'jpg', fit: 'cropbox'}"
			 [host]="'https://your-ie-distribution.cdn.imgeng.in'"
			 style="width: 100%; height: 25%"
			 ></lib-ngx-imageengine>
</div>
```

Notice here, we set the height to a fixed value on the `.card-element` div (it could be set on the class style rules as well - we set it on the `style` attribute just to make it obvious).
Then the `lib-ngx-imageengine` itself declares its relative size on the `style` attribute (here the same, you could set it through class rules or any other CSS selector).
And finally we pass `derive_size` and in the `wrapper_styles` we use relative dimensions.
This all means that if you want to use relative sizes with `derive_size` you need to ensure that the rendered component as some derivable dimensions, so that the wrapper styling can figure out what is its own dimensions.
