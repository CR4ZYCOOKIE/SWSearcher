export function convertBBCodeToHtml(text: string): string {
  if (!text) return '';
  
  return text
    // Headers
    .replace(/\[h1\](.*?)\[\/h1\]/gi, '<h1 class="text-3xl font-bold my-4">$1</h1>')
    .replace(/\[h2\](.*?)\[\/h2\]/gi, '<h2 class="text-2xl font-bold my-3">$1</h2>')
    .replace(/\[h3\](.*?)\[\/h3\]/gi, '<h3 class="text-xl font-bold my-2">$1</h3>')
    
    // URLs
    .replace(/\[url=([^\]]+)\](.*?)\[\/url\]/gi, '<a href="$1" class="text-blue-400 hover:text-blue-300 transition-colors" target="_blank" rel="noopener noreferrer">$2</a>')
    .replace(/\[url\](.*?)\[\/url\]/gi, '<a href="$1" class="text-blue-400 hover:text-blue-300 transition-colors" target="_blank" rel="noopener noreferrer">$1</a>')
    
    // Text formatting
    .replace(/\[b\](.*?)\[\/b\]/gi, '<strong>$1</strong>')
    .replace(/\[i\](.*?)\[\/i\]/gi, '<em>$1</em>')
    .replace(/\[u\](.*?)\[\/u\]/gi, '<u>$1</u>')
    .replace(/\[s\](.*?)\[\/s\]/gi, '<s>$1</s>')
    
    // Lists
    .replace(/\[list\]([\s\S]*?)\[\/list\]/gi, '<ul class="list-disc pl-5 my-2">$1</ul>')
    .replace(/\[\*\](.*?)(?=\[\*\]|\[\/list\])/gi, '<li>$1</li>')
    
    // Colors
    .replace(/\[color=([^\]]+)\](.*?)\[\/color\]/gi, '<span style="color: $1">$2</span>')
    
    // Line breaks
    .replace(/\r?\n/g, '<br>')
    
    // Code blocks
    .replace(/\[code\]([\s\S]*?)\[\/code\]/gi, '<pre class="bg-gray-800 p-4 rounded-lg my-2 overflow-x-auto"><code>$1</code></pre>')
    
    // Images
    .replace(/\[img\](.*?)\[\/img\]/gi, '<img src="$1" class="max-w-full rounded-lg my-2" alt="" loading="lazy" />');
} 