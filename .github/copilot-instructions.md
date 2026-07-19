# RocketPy Team Website - AI Coding Agent Instructions

## Project Overview
This is a **static marketing website** for RocketPy (rocketpy.org) - an open-source rocket trajectory simulator. The site is deployed via GitHub Pages and consists of pure HTML/CSS with no JavaScript framework.

## Architecture & Structure

### Core Pages
- `index.html` - Main landing page with project overview, features, and social links
- `about.html` - Team member profiles page (currently has placeholder content)

### Styling Approach
- **No CSS framework** - All styles are custom CSS, no Bootstrap/Tailwind usage
- `css/main.css` - Global styles and layout for index page (1000+ lines)
- `css/footer.css` - Shared footer component styles
- `about-css/main.css` - Styles specific to the about page
- Font Awesome icons loaded via local files in `css/font-awesome/`

### Design System
- **Custom class naming**: Uses verbose positional class names (e.g., `v33_2`, `v37_87`, `v35_22`)
  - These appear to be from a design tool export (likely Figma)
  - Classes combine position, layout, and content styling
- **Typography**: Primary fonts are "Ruda" (body) and "Nasalization" (headings) loaded from Google Fonts
- **Color scheme**: Dark blue/space theme with gradients (`rgba(33, 35, 50, 0.65)`, `rgba(3, 11, 40, 1)`)

### Image Assets
- Background images are referenced in CSS using optimized assets (e.g., `url("../images/hero-background.png")`)
- Section illustrations are scalable SVGs with descriptive filenames (e.g., `hero-trajectory.svg`, `community-network.svg`)
- Favicon and logo files are in `images/` directory

## Development Workflow

### Code Formatting
```bash
npm run format  # Runs Prettier on all HTML, CSS, JS files
```
Only dev dependency is Prettier (v3.3.3). Always format before committing.

### Local Preview
```bash
make start    # serve the source files at http://127.0.0.1:8000 (override with PORT=)
make status   # check whether the dev server is running
make stop     # stop the dev server
make build    # build the minified site into dist/
```
The `make` targets wrap `scripts/devserver.py`, a cross-platform (Windows/macOS/Linux) manager for a detached `python -m http.server`. Run `make help` to list all targets.

### Deployment
- **Automatic deployment** via GitHub Actions (`.github/workflows/static.yml`)
- Triggers on push to `master` branch
- No build step - deploys entire repository as-is to GitHub Pages
- Site URL: https://rocketpy.org

## Conventions & Patterns

### HTML Structure
1. **External resource loading**: Pages load multiple Google Fonts, Bootstrap CDN (only for CSS grid), and Font Awesome
2. **Inline onclick handlers**: Used sparingly (e.g., simulate button redirects to `https://app.rocketpy.org/`)
3. **Footer**: Consistent footer component across pages with team info, social links, and company details

### CSS Patterns
1. **Absolute positioning**: Heavy use of absolute positioning with `top`/`left` percentages for layout
2. **Background images**: Applied directly via CSS `background: url()` properties
3. **Responsive considerations**: Limited mobile responsiveness - appears optimized for desktop viewing
4. **Fixed dimensions**: Many elements use fixed widths (e.g., `width: 600px`) rather than responsive units

### Asset Management
- No image optimization pipeline - images stored directly in `images/` and `about-images/`
- Custom font file (`nasalization-rg.otf`) in root directory
- `node_modules/` gitignored but `package-lock.json` committed

## Integration Points

### External Services
- **Documentation**: Links to `docs.rocketpy.org` (hosted elsewhere)
- **Simulation app**: Links to `https://app.rocketpy.org/` (separate application)
- **GitHub repository**: Main project at `github.com/RocketPy-Team/RocketPy`
- **Social media**: Instagram, LinkedIn, YouTube, Discord links throughout

### Key Links to Preserve
- Academic paper: `ascelibrary.org/doi/10.1061/(ASCE)AS.1943-5525.0001331`
- Documentation examples: `docs.rocketpy.org/en/latest/examples/index.html`
- Discord invite: `discord.com/invite/b6xYnNh`

## Common Tasks

### Adding New Content
- Text content is inline in HTML - edit directly in `<span>` elements
- Maintain class naming pattern for consistency with existing design-tool-exported structure
- Footer updates require changes in both `index.html` and `about.html`

### Styling Changes
- Check both `css/main.css` and page-specific CSS files
- Many styles are tightly coupled to specific class names
- Background and decorative divs (empty `<div class="v##_##"></div>`) control layout sections

### About Page Work
- Currently has incomplete/placeholder content with team member sections
- Images for team members go in `about-images/`
- Follow the nested structure pattern already present for team member cards
