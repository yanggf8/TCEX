# TCEX - Taiwan Capital Exchange

A Taiwan-based financial asset exchange platform for SME revenue-sharing, with modern UX design.

## Project Structure

```
TCEX/
├── scraper.py              # Web scraper for MCEX reference data
├── mcex_scraped_data.json  # Scraped structure and content
├── SPEC.md                 # Complete technical specification
└── README.md               # This file
```

## Data Scraped from MCEX

- Navigation structure (7 main sections, 30+ pages)
- Component hierarchy (React/Next.js with CSS modules)
- Real-time statistics format
- Page layouts and sections
- Footer structure and contact info

## Key Differences from MCEX

1. **Region**: Taiwan (not Macau)
2. **Currency**: TWD (not MOP)
3. **Regulator**: Taiwan FSC (not Macau AMCM)
4. **UX Design**: New modern design (not copying MCEX layout)
5. **Social**: LINE (not WeChat)

## Next Steps

1. Review SPEC.md for complete technical details
2. Create UX/UI mockups
3. Initialize Next.js project
4. Build component library
5. Implement API layer

## Reference Data

The scraped data preserves MCEX's:
- Content structure
- Feature inventory
- Data models
- Navigation patterns

But we will redesign the visual presentation and user experience.
