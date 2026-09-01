import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'node:test';
import Markdown from 'react-markdown';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

describe('Knowledge Markdown stack', () => {
  it('renders headings, lists, code, tables, and does not execute HTML', () => {
    const markdown = [
      '## Heading',
      '',
      '- item',
      '',
      '```ts',
      'const ready = true;',
      '```',
      '',
      '| Col |',
      '|---|',
      '| cell |',
      '',
      'See [overview](../architecture/overview.md) and [site](https://example.com).',
      '',
      '<script>alert(1)</script>',
    ].join('\n');

    const html = renderToStaticMarkup(
      createElement(
        Markdown,
        {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug],
        },
        markdown,
      ),
    );

    assert.match(html, /id="heading"/);
    assert.match(html, /<li>item<\/li>/);
    assert.match(html, /language-ts/);
    assert.match(html, /<table>/);
    assert.match(html, /href="\.\.\/architecture\/overview\.md"/);
    assert.match(html, /href="https:\/\/example.com"/);
    assert.equal(html.includes('<script>alert(1)</script>'), false);
    assert.equal(html.includes('dangerouslySetInnerHTML'), false);
  });
});
