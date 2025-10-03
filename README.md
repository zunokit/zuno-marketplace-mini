# Zuno Marketplace Mini

A modern marketplace application built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🎨 Modern UI components with shadcn/ui
- 🌙 Dark mode support
- 📱 Responsive design
- ⚡ Fast development with Turbopack
- 🔧 TypeScript for type safety
- 🎭 Web3 integration with MetaMask SDK
- 📊 Chart components with Recharts
- 🔄 State management with Redux Toolkit

## Tech Stack

- **Framework**: Next.js 15.5.4
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives with shadcn/ui
- **Icons**: Lucide React
- **Web3**: MetaMask SDK, Ethers.js
- **Charts**: Recharts
- **State Management**: Redux Toolkit
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd zuno-marketplace-mini
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
```

3. Run the development server:
```bash
pnpm dev
# or
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   └── ui/            # shadcn/ui components
├── hooks/             # Custom React hooks
└── lib/               # Utility functions
```

## Development

This project uses:
- **Turbopack** for fast development builds
- **shadcn/ui** for consistent UI components
- **Tailwind CSS v4** for styling
- **TypeScript** for type safety

### Adding New Components

To add new shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

## Deployment

The easiest way to deploy is using [Vercel](https://vercel.com/new):

1. Push your code to GitHub
2. Import your repository in Vercel
3. Deploy automatically

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.