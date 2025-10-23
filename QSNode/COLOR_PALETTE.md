# 🎨 Aureo Bank - Color Palette & Design Tokens

## Official Color Palette

### **Primary Colors** (Purple Theme)
```
Deep Purple (Background Base)
  - Hex: #1a0a33
  - RGB: rgb(26, 10, 51)
  - Tailwind: from-purple-950

Medium Purple (Background Mid)
  - Hex: #33194d
  - RGB: rgb(51, 25, 77)
  - Tailwind: via-purple-900

Dark Purple (Background Variant)
  - Hex: #261440
  - RGB: rgb(38, 20, 64)
  - Tailwind: purple-900

Black (Background End)
  - Hex: #000000
  - RGB: rgb(0, 0, 0)
  - Tailwind: to-black
```

### **Accent Colors** (Gradients)
```
Purple Accent
  - Hex: #9933ff, #9966ff
  - RGB: rgb(153, 51, 255), rgb(153, 102, 255)
  - Tailwind: purple-600, purple-500

Blue Accent
  - Hex: #6699ff, #667aff
  - RGB: rgb(102, 153, 255), rgb(102, 122, 255)
  - Tailwind: blue-600, blue-500

Light Purple
  - Hex: #b399ff, #d8b4fe
  - RGB: rgb(179, 153, 255), rgb(216, 180, 254)
  - Tailwind: purple-400, purple-300

Light Blue
  - Hex: #99bbff, #bfdbfe
  - RGB: rgb(153, 187, 255), rgb(191, 219, 254)
  - Tailwind: blue-400, blue-300
```

### **UI Colors**
```
White (Text Primary)
  - Hex: #ffffff
  - RGB: rgb(255, 255, 255)
  - Opacity: 100% for headers, 80-90% for body

Purple Text Light
  - Hex: #e9d5ff
  - RGB: rgb(233, 213, 255)
  - Tailwind: purple-200

Purple Text Medium
  - Hex: #d8b4fe
  - RGB: rgb(216, 180, 254)
  - Tailwind: purple-300

Purple Text Dim
  - Hex: #c084fc
  - RGB: rgb(192, 132, 252)
  - Tailwind: purple-400
```

### **Success/Error Colors**
```
Success Green
  - Hex: #22c55e
  - RGB: rgb(34, 197, 94)
  - Tailwind: green-400, green-300

Error Red
  - Hex: #ef4444
  - RGB: rgb(239, 68, 68)
  - Tailwind: red-400, red-300

Warning Orange
  - Hex: #fb923c
  - RGB: rgb(251, 146, 60)
  - Tailwind: orange-400, orange-300

Info Blue
  - Hex: #3b82f6
  - RGB: rgb(59, 130, 246)
  - Tailwind: blue-500
```

---

## Design Tokens

### **Glassmorphism**
```css
/* Standard Glass Card */
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(20px);
border: 1px solid rgba(147, 102, 255, 0.3);
border-radius: 16px;
box-shadow: 0 8px 32px 0 rgba(147, 102, 255, 0.2);

/* Tailwind Classes */
bg-white/10
backdrop-blur-xl
border-purple-400/30
rounded-xl or rounded-2xl
shadow-lg shadow-purple-500/20
```

### **Logo Gradient**
```css
/* SwiftUI */
LinearGradient(
  colors: [
    Color(red: 0.6, green: 0.4, blue: 1.0),  // #9966ff
    Color(red: 0.4, green: 0.6, blue: 1.0)   // #6699ff
  ],
  startPoint: .topLeading,
  endPoint: .bottomTrailing
)

/* Tailwind/CSS */
background: linear-gradient(135deg, #9966ff 0%, #6699ff 100%);

/* Tailwind Classes */
bg-gradient-to-br from-purple-600 to-blue-600
```

### **Text Gradients**
```css
/* Title Gradient */
background: linear-gradient(90deg, #b399ff 0%, #99bbff 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;

/* Tailwind Classes */
bg-clip-text text-transparent 
bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400
```

### **Border Gradients**
```css
/* Card Border */
border-image: linear-gradient(
  135deg,
  rgba(255, 255, 255, 0.4),
  rgba(255, 255, 255, 0.1)
) 1;

/* Tailwind Approximation */
border border-white/20
or
border-purple-400/30
```

### **Shadows**
```css
/* Purple Glow */
box-shadow: 0 10px 40px rgba(147, 102, 255, 0.3);

/* Multiple Shadows */
box-shadow:
  0 8px 32px rgba(147, 102, 255, 0.2),
  inset 0 1px 1px rgba(255, 255, 255, 0.1);

/* Tailwind Classes */
shadow-lg shadow-purple-500/20
shadow-xl shadow-purple-500/30
```

---

## Component Styles

### **Card Style**
```tsx
className="
  bg-white/10 
  backdrop-blur-xl 
  rounded-2xl 
  p-6 
  border 
  border-purple-400/30 
  shadow-lg 
  shadow-purple-500/20 
  hover:border-purple-400/50 
  transition-all
"
```

### **Button Style** (Primary)
```tsx
className="
  px-6 
  py-3 
  bg-gradient-to-r 
  from-purple-600 
  to-blue-600 
  hover:from-purple-700 
  hover:to-blue-700 
  rounded-xl 
  font-semibold 
  transition-all 
  shadow-lg 
  shadow-purple-500/30
"
```

### **Input Style**
```tsx
className="
  bg-black/30 
  backdrop-blur-sm 
  border 
  border-purple-400/30 
  rounded-xl 
  px-4 
  py-3 
  text-white 
  placeholder-purple-400 
  focus:outline-none 
  focus:border-purple-400/60 
  focus:ring-2 
  focus:ring-purple-500/20
"
```

### **Logo Circle**
```tsx
className="
  relative 
  w-16 h-16 
  bg-gradient-to-br 
  from-purple-600 
  to-blue-600 
  rounded-full 
  flex 
  items-center 
  justify-center 
  border-2 
  border-purple-400/30 
  shadow-xl
"
```

---

## Typography

### **Font Families**
```css
/* Headings */
font-family: SF Pro Display, system-ui, -apple-system, sans-serif;
font-weight: 700; /* Bold */
font-style: rounded; /* SwiftUI design: .rounded */

/* Body */
font-family: SF Pro Text, system-ui, -apple-system, sans-serif;
font-weight: 500; /* Medium */

/* Monospace (Addresses) */
font-family: SF Mono, 'Courier New', monospace;
font-weight: 400; /* Regular */
```

### **Font Sizes**
```css
/* Mega (Splash) */
font-size: 48px;

/* Large (H1) */
font-size: 36-42px;

/* Medium (H2) */
font-size: 24-32px;

/* Regular (Body) */
font-size: 16px;

/* Small (Captions) */
font-size: 12-14px;

/* Tiny (Labels) */
font-size: 10-11px;
```

---

## Animation Values

### **Timing Functions**
```swift
/* SwiftUI */
.spring(response: 0.8, dampingFraction: 0.6)
.easeIn(duration: 1.0)
.easeOut(duration: 0.5)

/* CSS */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### **Durations**
```
Splash Screen: 4000ms (4s)
Logo Scale: 800ms
Tagline Fade: 1000ms
Card Hover: 300ms
Button Press: 200ms
Transition: 500ms
```

### **Delays**
```
Tagline: 1500ms after logo
Transition: 4000ms after start
Loading Dots: 200ms stagger
```

---

## Spacing System

### **Padding**
```
Tiny: 8px  (p-2)
Small: 12px (p-3)
Medium: 16px (p-4)
Large: 20px (p-5)
XLarge: 24px (p-6)
XXLarge: 32px (p-8)
```

### **Gaps**
```
Tight: 12px (gap-3)
Normal: 16px (gap-4)
Relaxed: 20px (gap-5)
Loose: 24px (gap-6)
XLoose: 32px (gap-8)
```

### **Border Radius**
```
Small: 12px (rounded-xl)
Medium: 16px (rounded-xl)
Large: 20px (rounded-2xl)
XLarge: 24px (rounded-3xl)
Circle: 50% (rounded-full)
```

---

## Opacity Values

### **Backgrounds**
```
Glassmorphic: 10% (bg-white/10)
Overlay: 20% (bg-purple-500/20)
Dim: 30% (opacity-30)
Medium: 50% (opacity-50)
Strong: 80% (opacity-80)
```

### **Text**
```
Primary: 100% (text-white)
Secondary: 90% (text-white/90)
Tertiary: 70% (text-purple-300)
Disabled: 50% (opacity-50)
Subtle: 60% (text-white/60)
```

### **Borders**
```
Subtle: 20% (border-white/20)
Normal: 30% (border-purple-400/30)
Strong: 50% (border-purple-400/50)
Focus: 60% (border-purple-400/60)
```

---

## Usage Guidelines

### **✅ DO**
- Use purple gradients for primary elements
- Apply glassmorphism to cards
- Maintain consistent border radius (16-24px)
- Use white text with appropriate opacity
- Add shadow for depth
- Animate transitions smoothly

### **❌ DON'T**
- Mix too many gradient directions
- Use flat backgrounds without blur
- Forget shadow effects
- Use pure black (#000) for borders
- Overcomplicate animations
- Ignore contrast for accessibility

---

## Quick Reference

### **Background Gradient**
```css
background: linear-gradient(135deg, #1a0a33, #33194d, #261440, #000);
```

### **Card Glassmorphism**
```css
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(20px);
border: 1px solid rgba(147, 102, 255, 0.3);
box-shadow: 0 8px 32px rgba(147, 102, 255, 0.2);
```

### **Logo Gradient**
```css
background: linear-gradient(135deg, #9966ff, #6699ff);
```

### **Text Gradient**
```css
background: linear-gradient(90deg, #b399ff, #99bbff, #b399ff);
background-clip: text;
color: transparent;
```

---

## Export for Designers

### **Figma Colors**
```
Primary Purple: #33194d
Accent Purple: #9966ff
Accent Blue: #6699ff
Text Light: #e9d5ff
Success: #22c55e
```

### **Sketch Swatches**
```xml
<color name="Primary Purple" r="51" g="25" b="77" a="255"/>
<color name="Accent Purple" r="153" g="102" b="255" a="255"/>
<color name="Accent Blue" r="102" g="153" b="255" a="255"/>
```

### **Adobe XD**
```
#33194d - Primary Background
#9966ff - Primary Accent
#6699ff - Secondary Accent
#e9d5ff - Text Light
```

---

*Aureo Bank Color System - Professional Banking Aesthetic* 🎨

