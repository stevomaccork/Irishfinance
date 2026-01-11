# Slainte Finance

Interactive Irish Personal Finance Guide based on the r/irishpersonalfinance flowchart.

## Features

- **Comprehensive Assessment** - 7 sections covering your complete financial picture
- **Personalised Plan** - AI-powered or rule-based milestone plan with monthly and yearly goals
- **Privacy-First** - All data stays in your browser. No accounts, no servers, no tracking.
- **Bring Your Own Key** - Uses your own OpenAI API key for AI features (optional)
- **Mobile Friendly** - Works great on phones, tablets, and desktop
- **Export Options** - Download your data as JSON

## Privacy

This app is designed with privacy as the core principle:

- **No backend server** - It's a static site
- **No accounts** - No signup required
- **No tracking** - No analytics
- **Local storage only** - Your data never leaves your browser
- **Your API key** - AI calls go directly from your browser to OpenAI
- **Open source** - Verify everything yourself

## How It Works

1. Complete the financial assessment (takes ~15 minutes)
2. Optionally enter your OpenAI API key for AI-powered plan generation
3. Generate your personalised financial plan
4. Export your data as JSON

Without an API key, you still get rule-based recommendations based on the flowchart logic.

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS v4 + shadcn/ui components
- OpenAI API (client-side, optional)

## Credits

- Original flowchart by the r/irishpersonalfinance community
- Based on Irish tax rules, pension relief limits, and financial products

## Disclaimer

This tool provides educational information only, not financial advice. Always consult a qualified financial advisor for personal advice. See CCPC (https://www.ccpc.ie/consumers/) for official consumer guidance.

## License

MIT
