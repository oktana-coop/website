# Oktana Website

This is the codebase for the [Oktana website](https://oktana.dev) (including the [blog](https://oktana.dev/blog)).

Built using [Astro](https://astro.build/).

## How to add Blog Posts

Blog posts are written in Markdown and are located in `content/blog`. Just add a new markdown file there and it will get a URL corresponding to the file name and appear in the blog posts list. Make sure to set the metadata properly, defined at the top of the Markdown file (before the actual Markdown).

When updating blog posts, it's good to set the updated-at date manually in the metadata (this hasn't yet been automated).

## Development

These are the basic commands used for development:

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `npm install`     | Installs dependencies                        |
| `npm run dev`     | Starts local dev server at `localhost:4321`  |
| `npm run build`   | Build your production site to `./dist/`      |
| `npm run preview` | Preview your build locally, before deploying |

### Pages and Routing

Astro is opinionated in how you add routes, so it's good to familiarize with [file-based routing](https://docs.astro.build/en/guides/routing/) if you want to add a new page.

### Content & Blog

Astro [Content Collections](https://docs.astro.build/en/guides/content-collections/) are used for defining and loading the blog posts.

### Email Subscriptions & Database Connection

In order for the subscribe/unscubscribe functionality to work, the following environment variables need to be set:

- `DATABASE_URL`: The PostgreSQL database connection string
- `DATABASE_SSL`: A boolean value that instructs whether to use SSL or not when connecting to the database

These are already set in the deployed version of the app. In development, you'll need to create a `.env` file that includes these variables.

## Deployment

The website is currently deployed to [Netlify](https://www.netlify.com/) using the relevant [Netlify Adapter](https://docs.astro.build/en/guides/integrations-guide/netlify/). Every time you push to the `main` branch, a fresh Netlify deployment is triggered (there is an integration between GitHub and Netlify).
