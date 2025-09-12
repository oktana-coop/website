---
slug: rich-text-representations
title: 'Rich Text Representations'
description: 'This post explores various models for representing rich text: Pandoc, ProseMirror and Automerge. All three models are used in our v2 editor for various use cases: Drafting documents in the web, seamlessly merging even in a live collaboration setting, diffing and converting between formats.'
status: 'draft'
createdAt: '2025-09-05'
updatedAt: '2025-09-05'
---

# Rich Text Representations

This document describes some popular rich text representation formats that are important for:

1.  Drafting rich text documents in a browser environment
2.  Managing rich text document versions
3.  Converting across various rich text document representations

## Pandoc

Pandoc is structured as a set of readers, which translate various input formats into an **abstract syntax tree** (the Pandoc AST) representing a structured document, and a set of writers, which render this AST into various output formats. Widely used for document conversions, this is the general flow:

    [input format] ==reader==> [Pandoc AST] ==writer==> [output format]

The [Pandoc data type](https://hackage.haskell.org/package/pandoc-types-1.23.1/docs/Text-Pandoc-Definition.html 'Pandoc data type') contains a list of blocks, which can contain inline nodes and some of which are container nodes, which means they may contain other blocks. The following Haskell data types will be helpful:

- [Block](https://hackage.haskell.org/package/pandoc-types-1.23.1/docs/Text-Pandoc-Definition.html#t:Block 'Block') type
- [Inline](https://hackage.haskell.org/package/pandoc-types-1.23.1/docs/Text-Pandoc-Definition.html#t:Inline 'Inline') type

As can be seen, inline nodes can also contain other inlines, which is useful when some text has multiple marks (e.g. **_bold and italics_**).

Pandoc's internal representation abstract syntax tree (AST) can be serialized to JSON format, so for the following Markdown document:

```markdown
# A heading 1

A paragraph with some **bold** and then some _italics_ text.

And below is a list:

- item 1
  - item 1.1
  - item 1.2
- item 2
```

We get the following serialized Pandoc AST:

```txt
[ Header 1 ( "" , [] , [] ) [ Str "A heading 1" ]
, Para
    [ Str "A paragraph with some "
    , Strong [ Str "bold" ]
    , Str " and then some "
    , Emph [ Str "italics" ]
    , Str " text."
    ]
, Para [ Str "And below is a list:" ]
, BulletList
    [ [ Plain [ Str "item 1" ]
      , BulletList
          [ [ Plain [ Str "item 1.1" ] ]
          , [ Plain [ Str "item 1.2" ] ]
          ]
      ]
    , [ Plain [ Str "item 2" ] ]
    ]
]
```

There is no indexing in Pandoc (unlike ProseMirror and Automerge).

## ProseMirror

As described [here](https://prosemirror.net/docs/guide/#doc 'here'), ProseMirror has two rich text representations:

### Tree Representation

A ProseMirror document is a **tree of nodes** compliant to the defined schema, with some specificities (e.g. compared with the browser DOM) in how it models inline content. This seems to be the definitive data model of ProseMirror.

### Flat Sequence of Tokens

ProseMirror also supports indexing document positions as flat sequence of tokens, which is useful when one wants to address a specific position in the document. This type of indexing allows any document position to be represented as an integer - the index in the token sequence. These tokens don't actually exist as objects in memory - they are just a counting convention. The following rules apply:

- The start of the document, right before the first content, is position 0.
- Entering or leaving a node that is not a leaf node (i.e. supports content) counts as one token. So if the document starts with a paragraph, the start of that paragraph counts as position 1.
- Each character in text nodes counts as one token. So if the paragraph at the start of the document contains the word , position 2 is after the , position 3 after the , and position 4 after the whole paragraph.
- Leaf nodes that do not allow content (such as images) also count as a single token.

So if you have a document that, when expressed as HTML, would look like this:

```html
<p>One</p>
<blockquote>
  <p>Two<img src="..." /></p>
</blockquote>
```

The token sequence, with positions, looks like this:

```
0   1 2 3 4    5
  <p> O n e </p>

5            6   7 8 9 10    11   12            13
  <blockquote> <p> T w o <img> </p> </blockquote>
```

## Automerge

Automerge defines the following primitives for working with rich text:

- Block markers, which divide text into blocks.

All text following a block marker until the next block marker or the end of the document belongs to the block marker, with the exception of embed blocks, which are not discussed here.

- Marks, which are formatting spans applied to a range of characters and can overlap

Practically, this means that Automerge **doesn't represent the document as a tree**, like ProseMirror or Pandoc do.

### Modeling Hierarchical Structure

As described [here](https://automerge.org/docs/under-the-hood/rich_text_schema/#parents---representing-hierarchical-structure 'here'), block markers also have a parents property, which represents the ordered list of blocks it appears inside (the block marker's ancestor path).

Consider the following sample document (taken from [automerge-prosemirror](https://github.com/automerge/automerge-prosemirror/blob/main/test/traversal.spec.ts#L111 'automerge-prosemirror') library's tests):

    const { spans } = docFromBlocksNotation([
      { type: "paragraph", parents: [], attrs: {} },
      "paragraph",
      {
        type: "ordered-list-item",
        parents: ["unordered-list-item"],
        attrs: {},
      },
      "item 1",
    ]);

This is essentially a document with a paragraph that contains the text and then an ordered list with one list item with the text , which is nested inside an unordered list with just one item. Here is how the document is represented in Automerge, HTML and ProseMirror:

```
// am:   0  1 2 3 4 5 6 7 8 9                               10       11  12 13 14 15   16
//      <p> p a r a g r a p h </p> <ul> <li> <p> </p> <ol> <li> <p>  i   t  e  m  ' '  1 </p> </li> </ol> </li> </ul>
// pm: 0   1 2 3 4 5 5 6 6 9 10   11   12   13  14   15   16   17  18 19 20 21  22   23  24  25   26    27    28
```

Note that, when translating the Automerge rich text model to a tree-like structure like HTML's, whole tags (block elements) are **inferred**. From the single list item block marker above, both the parent ordered list and its wrapper unordered list with the list item have to be inferred.

### Automerge Spans

Automerge offers the [Spans API](https://automerge.org/docs/reference/documents/rich_text/#the-spans-api 'Spans API') as an alternative of working with block markers and spans directly.

Assuming we have the following Markdown representation:

    # A heading 1

    A paragraph with some **bold** and then some *italics* text.

    And below is a list:

    -   item 1
        -   item 1.1
        -    item 1.2
    -   item 2

This is how it would be represented with Automerge spans:

```json
[
  {
    "type": "block",
    "value": {
      "parents": [],
      "isEmbed": false,
      "attrs": { "level": 1 },
      "type": "heading"
    }
  },
  { "type": "text", "value": "A heading 1" },
  {
    "type": "block",
    "value": {
      "attrs": {},
      "type": "paragraph",
      "parents": [],
      "isEmbed": false
    }
  },
  { "type": "text", "value": "A paragraph with some " },
  { "type": "text", "value": "bold", "marks": { "strong": true } },
  { "type": "text", "value": " and then some " },
  { "type": "text", "value": "italics", "marks": { "em": true } },
  { "type": "text", "value": " text." },
  {
    "type": "block",
    "value": {
      "attrs": {},
      "type": "paragraph",
      "isEmbed": false,
      "parents": []
    }
  },
  { "type": "text", "value": "And below is a list:" },
  {
    "type": "block",
    "value": {
      "isEmbed": false,
      "type": "unordered-list-item",
      "parents": [],
      "attrs": {}
    }
  },
  { "type": "text", "value": "item 1" },
  {
    "type": "block",
    "value": {
      "attrs": {},
      "isEmbed": false,
      "parents": ["unordered-list-item"],
      "type": "unordered-list-item"
    }
  },
  { "type": "text", "value": "item 1.1" },
  {
    "type": "block",
    "value": {
      "attrs": {},
      "isEmbed": false,
      "type": "unordered-list-item",
      "parents": ["unordered-list-item"]
    }
  },
  { "type": "text", "value": " item 1.2" },
  {
    "type": "block",
    "value": {
      "parents": [],
      "type": "unordered-list-item",
      "isEmbed": false,
      "attrs": {}
    }
  },
  { "type": "text", "value": "item 2" }
]
```

Note that there are block marker objects between the text ones. Also, note the hierarchy manifestation with the parents field in list items.
