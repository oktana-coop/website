---
slug: v2-technical-dive
title: 'v2 Technical Dive'
description: 'A deep dive into the technical stack, architecture, and challenges behind our new rich text editor, v2. We share our experience building a local-first cross-platform app, blending TypeScript (Electron) and Haskell (via WASM), and how our integration of Automerge, ProseMirror, and Pandoc enables seamless versioning and format conversion.'
image: 'https://oktana.dev/v2-1200x630.png'
status: 'published'
createdAt: '2025-09-04'
updatedAt: '2026-01-20'
publishedAt: '2026-01-20'
---

# v2 Technical Dive

This document contains a technical dive into the technical stack, architecture, and challenges behind our new rich text editor, _[v2](https://v2editor.com 'v2')_. As discussed in the [editor manifesto](https://oktana.dev/blog/introducing-v2-editor/ 'editor manifesto'), v2 is built around the following principles:

- User agency

- Collaboration
  - Consensual & non-intrusive

  - Asynchronous by default

  - Real-time on demand

- Interoperability

- Composability

- Longevity

- Focused, non-distracted thinking

In the sections to follow, we will try to describe *how* out technical stack works in coordination to fulfill them.

## Domain (Rich-Text)

Although many people have a rough idea of what rich or formatted text is, there is no standard or universally accepted definition of it, which makes it a concept difficult to approach technically. As discussed in v2 manifesto, for most people, rich text evokes the ability to augment plain text with annotations like bold, italics and hyperlinks and some basic block elements like paragraphs and lists. But, especially with the advent of Markdown, the notion of rich text has been expanded to include block-level elements like various levels of headings, images, code blocks, block quotes as well as more inline elements such as inline code spans and footnotes and arguably extending to blocks corresponding to more structured data, like database table views. So it's more useful to think of the richness of text as a spectrum [^1], with product and design decisions affecting how each team decides to enable augmenting content in their product. For us, the goal at this early stage is to offer some widely used and common rich text capabilities so that we have an editor people can start using and give us directions on what are the next, more specific pieces of functionality important for their use case, and this is why we opted to support the really core and common Markdown features. The flavor of Markdown we want to reach parity with is [Pandoc's Markdown](https://pandoc.org/MANUAL.html#pandocs-markdown), which is a superset of the most widely used Markdown flavors and which we consider a big step towards building a truly interoperable editor. In general, we wanted to leave the design open and ideally make it easy to iteratively push along the rich text spectrum as we make fewer assumptions in this initial stage and then try to better understand what features are important for our users.

### Rich Text Model(s)

As described in the [rich-text representations](https://oktana.dev/blog/rich-text-representations/ 'rich-text representations') document, we are working with a handful of foundational tools representing rich text, each approaching it from a different angle:

- [Pandoc](https://pandoc.org 'Pandoc')\'s model aims at supporting conversion across various rich text document representations.

- [ProseMirror](https://prosemirror.net 'ProseMirror')\'s model is centered around the use case of drafting rich text documents in a browser environment.

- [Automerge](https://automerge.org/docs/reference/documents/rich-text/ 'Automerge')\'s model is good at managing rich text document versions and resolving conflicts that may arise as multiple users edit the same document, even in a live collaboration setting.

The truth is that we desire *v2* to do all of the above well, leveraging the above foundational technologies, letting each one do what it excels at. Also, we want to add some capabilities, like having a diff engine that is **rich-text-native**, and not based on plain text like most systems we\'ve encountered. This means that we formalize in our type system the various diff operations. To make the latter more clear, consider the following example:

- In a model that captures rich text semantics better, a heading level change is a [specific type of diff](https://github.com/oktana-coop/pandoc-diff/blob/c47b22b2109748c32318abba4881c010ee6a1da4/src/RichTextDiffOp.hs#L7 'specific type of diff'), where the type of the block remains `Heading`, but the level changes from `2` to `3` or similar.

- The same change in a plain text diff engine is a text diff (e.g. `## Heading` → `### Heading`).

Likewise, we strive for writing code that expresses mark changes (e.g. `strong` → `emphasis`) in its type system, rather than relying on plain text representations that leave this implicit.

With the above specifications in mind, we can say that we are indeed using multiple rich text models in _v2_, depending on the task the user is performing. Leveraging Pandoc\'s magic and some modules we wrote ourselves for converting Pandoc to [ProseMirror](https://github.com/oktana-coop/v2-hs-lib/tree/48f9687dce7b1ef70dbf21e3193c7846a1d60a8a/src/ProseMirror 'ProseMirror') and [Automerge](https://github.com/oktana-coop/automerge-pandoc 'Automerge') and vice versa, it is easy to switch from one model to another. The ProseMirror model is in play as the user edits content in the app, but we switch to the Pandoc-based model when the app writes the Markdown file to the filesystem. Finally, the Automerge model is used to provide a suggested merge conflict resolution and will be used even more extensively as we introduce live collaborative sessions in the future. If we want to think of one model as being at the core of the app, there is a [tree model of rich text](https://github.com/oktana-coop/pandoc-tree 'tree model of rich text'), based on and using as much as possible the [Pandoc types](https://hackage.haskell.org/package/pandoc-types 'Pandoc types'). On top of it, we built a [rich-text-native diff engine](https://github.com/oktana-coop/pandoc-diff 'rich-text-native diff engine'), which combines a tree diffing algorithm with an inline diffing algorithm (patience diff) to add the diff annotations. This engine is currently used to display the diff views in _v2_, but the fact that it's built with the Pandoc model in mind means that other engineers can leverage it to display sophisticated diffing views in their tools, building on and extending our work.

One can easily understand how important all the above are in making v2 interoperable and composable with other tools, while also providing the much needed user agency, data ownership and longevity. The app can work with any of the rich text models we mentioned and it has the ability of switching between them at will. This enables the user to start a document by pasting Markdown, edit the content using ProseMirror magic and then have the app write the output to a portable Markdown document in their filesystem, one which they can also use with other tools if they desire to. Also, even in this early stage in which we haven\'t implemented a polished PDF export function or sophisticated export/publishing styles, the user can easily export to Docx and handle formatting and styling in Microsoft Word, before exporting to PDF. Finally, we are in a very strong position to implement features like imports and exports to any format Pandoc supports, diffing and merge conflict experiences that capture rich text semantics very well, and live collaborative editing even without a central server controlling the order of operations.

## Infrastructural Technologies

### Version Control

Version control is at the core of _v2_, one of its defining features. As software engineers, we have been reaping the benefits of version control for years, and getting good at the relevant tools and workflows is one of the first things a professional developer has to learn in order to write code in a structured and effective manner, as well as collaborate with others. Following Ink & Switch\'s vision [^2], we believe that version control systems will benefit most knowledge workers, and this of course includes writing and rich text.

#### Git and Automerge

In order to develop v2, we experimented with two such systems, [Git](https://git-scm.com 'Git') and [Automerge](https://automerge.org 'Automerge'), both of which can support the asynchronous collaboration scenario. After lots of experimentation, we decided to abstract away the version control system, which allows decoupling the editor front-end and the diffing algorithm from it. Git is the more mature between the two and it is very powerful and battle-tested when it comes to branching and asynchronous collaboration, so in this version it is our preferred version control system. But switching to Automerge is a matter of configuration and implementation of some missing features (e.g. branching and explicit sync), and the most probable future is to make this option a user or project preference. Automerge is a really exciting project and its promise is to become the new filesystem of computing upon which local-first apps can be built [^3]. It is a [CRDT](https://crdt.tech 'CRDT') implementation and therefore guarantees that, even if users are concurrently editing in real time, it can safely merge the changes without corrupting the document. Importantly, this can also happen without the mediation of a central authority, so we can build live collaboration workflows using decentralized or peer-to-peer topologies. Even if live collaborative editing is not the focus for us at this point, building on top of Automerge allows us to leave the design open for implementing such workflows in a future version. A hybrid approach (using Git for the asynchronous collaboration part and Automerge to facilitate live collaboration sessions or enable resolving conflicts seamlessly) is also very probable. We are actually doing the latter already (offering a suggested merge conflict resolution via Automerge to conflicts Git finds).

Last but not least, we should mention the great [isomorphic-git](https://isomorphic-git.org 'isomorphic-git') library, which is a JavaScript implementation of Git that works in both Node.js and browser environments. It is currently the way we are using Git in the application and it has been serving us very well. 

### Cross-Platform Desktop

We wanted _v2_ to be distributed as a desktop app, and available for the major operating systems (macOS, Windows, Linux). A relevant decision was whether we would build native applications for these or if we would leverage a framework for cross-platform desktop apps. Although we understand that building native applications would enable us to build an app that more closely matches the operating system\'s ecosystem, building a cross-platform app with web technologies offered us two significant advantages:

- Having to maintain a **single codebase** for all operating systems. Our team is small and maintaining multiple codebases would result in moving much slower.

- Making the app **ready for the web**. _v2_\'s user interface is built using web technologies (HTML, CSS, JavaScript and WebAssembly) and, even if it\'s not visible since it\'s packaged as a desktop app, it follows best practices in terms of URL design. These properties make it much easier to ship a web app version like [VS Code for the Web](https://code.visualstudio.com/docs/setup/vscode-web 'VS Code for the Web') or build a complementary app that takes care of a part of the writing workflow (e.g. social collaboration) in a web environment.

For the above reasons we opted to build _v2_ on top of [Electron](https://www.electronjs.org 'Electron'), which is a very mature framework for building cross-platform desktop apps with web technologies. Electron is stable, battle-tested, the team behind it has put lots of thought in aspects like [security](https://www.electronjs.org/docs/latest/tutorial/security 'security') and it also has a great ecosystem: [electron-builder](https://www.electron.build 'electron-builder') assists and guides you very well in managing the daunting task of building, publishing and updating the app for the various platforms. The VS Code team has published great resources regarding security and architecture, like the one for [process sandboxing](https://code.visualstudio.com/blogs/2022/11/28/vscode-sandbox 'process sandboxing'). There are, of course, interesting alternatives to Electron like [Tauri](https://tauri.app 'Tauri') which bring other languages like [Rust](https://rust-lang.org 'Rust') into the mix, which we would like to explore in the future.

Electron adopts a [multi-process](https://www.electronjs.org/docs/latest/tutorial/process-model 'multi-process') architecture and as a developer you get a _main_ process, which runs in a [Node.js](https://nodejs.org/en 'Node.js') environment, and one or more _renderer_ processes, which are responsible for rendering web content. There are lots of advantages and challenges that come with this architecture, which we\'ll probably discuss in a dedicated post. For the web application (renderer) part, we decided to use [React](https://react.dev 'React'), which is a mature and battle-tested web framework and allows us to implement the app using reusable components. We should also mention [Tailwind CSS](https://tailwindcss.com 'Tailwind CSS'), the framework we are using to style our web components, and [Vite](https://vite.dev 'Vite'), our selected build tool.

### Multilingual (Programming Languages)

_v2_ is programmatically integrated with [Pandoc](https://pandoc.org 'Pandoc'), which is a great piece of software for converting across rich text markup formats. What is important from the programming-languages point of view is that Pandoc is written in [Haskell](https://www.haskell.org 'Haskell'). Given that we wanted to use it as a code dependency, we needed to build a Haskell module which would co-operate with the rest of the application code, which is written in TypeScript and, as previously discussed, gets executed in a Node.js or Chromium (browser) environment. Fortunately, there is now a solution to this problem, [WebAssembly](https://webassembly.org 'WebAssembly'), which allows us to compile and package the Haskell code in a way that can be used by Node.js and the browser using JavaScript APIs.

And this is exactly what we did: we built our Haskell code targeting WebAssembly, and exposing a command line interface (CLI). The latter gave us the following advantages:

- Leveraging [WebAssembly System Interface (WASI)](https://wasi.dev 'WebAssembly System Interface (WASI)'), an effort of standardizing APIs for WebAssembly, including I/O. WASI has [experimental support in Node.js](https://nodejs.org/api/wasi.html 'experimental support in Node.js') and there is an npm module ([\@wasmer/wasi](https://www.npmjs.com/package/@wasmer/wasi#wasmer-wasi '@wasmer/wasi')) that can be used in a browser environment.

- Avoiding mappings between text/string types across languages. The CLI treated everything (input and output) as a stream of text and this offered us a much-needed simplicity.

- Allowing us to use and test the Haskell modules in isolation through the terminal.

The reality of developing the solution was much more difficult and challenging than described in these lines, and we are really thankful to everyone contributing to [Haskell & WASM/WASI](https://gitlab.haskell.org/haskell-wasm/ghc-wasm-meta 'Haskell & WASM/WASI') bindings. But it works, and it does so with good performance: The application goes through the Haskell library continuously as the user types in the editor (with a small debounce time), primarily to convert the ProseMirror representation in the representation we use in the filesystem, currently Markdown. And this happens without any perceptible lag.

## Developer Tooling

### Electron Builder with GitHub Actions

Packaging and updating a cross-platform desktop app is a complex task, one that can become very error prone if done manually. This is the reason we were looking for a good way to automate it. The solution we arrived at was a [GitHub CI workflow](https://github.com/oktana-coop/v2/blob/c93f8df2a7f44b5cddcd664ad55a01713ef1a919/.github/workflows/release.yml 'GitHub CI workflow') which we run from the GitHub Actions user interface when we want to release the app and roughly does the following:

1.  Checks out the code.

2.  Bumps the application version and commits the change.

3.  Creates runners for each of the target operating systems (macOS, Linux, Windows), and in each of them:
    1.  Installs the app\'s dependencies.

    2.  Builds and packages the app in a way that is suitable for the corresponding operating system. This could include more than one build (for example, in macOS, it builds artifacts for both ARM and older Intel architectures. We are very thankful of the team behind [electron-builder](https://www.electron.build 'electron-builder'), the great work of whom really facilitates this part.

4.  Organizes the build artifacts by operating systems and creates a GitHub release with them. A GitHub release contains these artifacts in these assets, and we can link to them in the application website. We are dynamically fetching the latest release and its artifacts in _v2_\'s website.

5.  If an error happened in any of the above, there is an action in the end that reverts the version bump in the codebase.

The above workflow is used for some months now and resulted in easy and automated application releases as it includes very few points that require human interaction. It is important to mention that GitHub does not charge public repositories for using their CI runners, which is a very helpful and reduces our costs.

[^1]: Sarah Lim, Marc McGranaghan, Sarah Lim's interview with Adam Wiggins and Mark McGranaghan, Metamuse Episode 48, Rich text with Slim Lim, 00:18:20, podcast audio, January 20, 2022, https://museapp.com/podcast/48-rich-text/

[^2]: Geoffrey Litt, Paul Sonnentag, Max Schöning, Adam Wiggins, Peter van Hardenberg, Orion Henry. Patchwork: Version control for everything. February 2024. https://www.inkandswitch.com/patchwork/notebook/

[^3]: Peter van Hardenberg, Local First Podcast hosted by Johannes Schickling, Special episode: Apps vs Files with Gordon Brander, Peter van Hardenberg & Jess Martin, 00:19:41, podcast audio, December 31, 2024, https://www.localfirst.fm/s1
