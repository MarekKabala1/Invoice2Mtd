import { convertHtmlToText } from '@/utils/textHelpers';

describe('Text Helpers', () => {
  describe('convertHtmlToText', () => {
    it('should convert basic HTML to plain text', () => {
      const html = '<p>Hello World</p>';
      const result = convertHtmlToText(html);
      expect(result).toBe('Hello World');
    });

    it('should handle multiple paragraphs', () => {
      const html = '<p>First paragraph</p><p>Second paragraph</p>';
      const result = convertHtmlToText(html);
      expect(result).toBe('First paragraph\n\nSecond paragraph');
    });

    it('should handle div tags', () => {
      const html = '<div>First div</div><div>Second div</div>';
      const result = convertHtmlToText(html);
      expect(result).toBe('First div\nSecond div');
    });

    it('should handle headings', () => {
      const html = '<h1>Title</h1><h2>Subtitle</h2>';
      const result = convertHtmlToText(html);
      expect(result).toBe('Title\n\nSubtitle');
    });

    it('should handle br tags', () => {
      const html = 'Line 1<br>Line 2<br/>Line 3';
      const result = convertHtmlToText(html);
      expect(result).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should handle strong tags as bold markers', () => {
      const html = '<p>This is <strong>bold text</strong> and normal text</p>';
      const result = convertHtmlToText(html);
      expect(result).toBe('This is **bold text** and normal text');
    });

    it('should remove span tags but keep content', () => {
      const html = '<p>This is <span class="highlight">highlighted text</span></p>';
      const result = convertHtmlToText(html);
      expect(result).toBe('This is highlighted text');
    });

    it('should remove all HTML tags', () => {
      const html = '<div><p>Text with <em>emphasis</em> and <strong>bold</strong></p></div>';
      const result = convertHtmlToText(html);
      expect(result).toBe('Text with emphasis and **bold**');
    });

    it('should handle nested tags', () => {
      const html = '<div><p><strong>Bold</strong> text with <em>emphasis</em></p></div>';
      const result = convertHtmlToText(html);
      expect(result).toBe('**Bold** text with emphasis');
    });

    it('should remove html and body tags', () => {
      const html = '<html><body><p>Content inside body</p></body></html>';
      const result = convertHtmlToText(html);
      expect(result).toBe('Content inside body');
    });

    it('should handle empty string', () => {
      const result = convertHtmlToText('');
      expect(result).toBe('');
    });

    it('should handle string with only whitespace', () => {
      const result = convertHtmlToText('   \n\n   ');
      expect(result).toBe('');
    });

    it('should trim leading and trailing whitespace', () => {
      const html = '  \n  <p>Content</p>  \n  ';
      const result = convertHtmlToText(html);
      expect(result).toBe('Content');
    });

    it('should collapse multiple newlines', () => {
      const html = '<div>First</div>\n\n\n<div>Second</div>';
      const result = convertHtmlToText(html);
      expect(result).toBe('First\n\nSecond');
    });

    it('should handle complex HTML', () => {
      const html = `
        <html>
          <body>
            <h1>Invoice</h1>
            <div>
              <p>Dear Customer,</p>
              <p>Please find the invoice details below:</p>
              <ul>
                <li>Item 1: $100</li>
                <li>Item 2: $200</li>
              </ul>
              <p><strong>Total: $300</strong></p>
            </div>
          </body>
        </html>
      `;
      const result = convertHtmlToText(html);
      expect(result).toContain('Invoice');
      expect(result).toContain('Dear Customer');
      expect(result).toContain('Item 1: $100');
      expect(result).toContain('Total: $300');
    });

    it('should handle self-closing tags', () => {
      const html = '<p>Line 1<br/>Line 2<br />Line 3</p>';
      const result = convertHtmlToText(html);
      expect(result).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should preserve content with mixed tag types', () => {
      const html = '<div><p>Text with <strong>bold</strong> and <em>italic</em></p></div>';
      const result = convertHtmlToText(html);
      expect(result).toBe('Text with **bold** and italic');
    });

    it('should handle attributes in tags', () => {
      const html = '<p class="content" id="main">Text with attributes</p>';
      const result = convertHtmlToText(html);
      expect(result).toBe('Text with attributes');
    });

    it('should not modify plain text without HTML', () => {
      const text = 'This is plain text without any HTML tags.';
      const result = convertHtmlToText(text);
      expect(result).toBe('This is plain text without any HTML tags.');
    });

    it('should handle HTML entities', () => {
      const html = '<p>Price: &pound;100 &amp; tax</p>';
      const result = convertHtmlToText(html);
      // Note: HTML entities are not decoded by this function
      expect(result).toBe('Price: &pound;100 &amp; tax');
    });
  });
});