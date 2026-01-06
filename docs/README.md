# Cards House - Component Documentation

Welcome to the Cards House component documentation. This directory contains detailed documentation for all reusable components in the project.

## Components

### [PlayerCircle](./PlayerCircle/)
An animated player avatar component with countdown timer functionality. Features a disappearing progress ring that can trigger AI auto-play when time expires.

**Key Features:**
- Animated countdown ring that shrinks over time
- Color-coded progress (green → red)
- Pump animation when active
- Auto-trigger AI gameplay
- Manual timer control via refs
- Player profile modal

**Documentation:**
- [Overview & Usage](./PlayerCircle/README.md)
- [API Reference](./PlayerCircle/API-Reference.md)
- [Examples](./PlayerCircle/Examples.md)

## Quick Start

Each component documentation includes:

- 📋 **Overview**: What the component does
- 🚀 **Installation**: Required dependencies
- 💡 **Basic Usage**: Simple implementation example
- ⚙️ **Props**: Complete props reference
- 🔧 **Advanced Usage**: Complex scenarios and customization
- 🎯 **Examples**: Working code examples
- 🐛 **Troubleshooting**: Common issues and solutions

## Project Structure

```
docs/
├── README.md                    # This file
├── PlayerCircle/               # PlayerCircle component documentation
│   ├── README.md              # Overview & usage guide
│   ├── API-Reference.md       # Technical API reference
│   └── Examples.md            # Practical examples
└── ...                        # Additional component docs

components/
├── PlayerCircle.js            # PlayerCircle component
└── ...                        # Other components

examples/
├── PlayerCircleExample.js     # PlayerCircle usage example
└── ...                        # Other examples
```

## Development Guidelines

### Component Documentation Standards

When creating new components, please include:

1. **Clear Overview**: What problem does it solve?
2. **Props Table**: All props with types, defaults, and descriptions
3. **Usage Examples**: Basic and advanced use cases
4. **Ref Methods**: If the component exposes methods via refs
5. **Callbacks**: All callback functions and their parameters
6. **Styling**: Customization options
7. **Performance Notes**: Any performance considerations
8. **Troubleshooting**: Common issues and solutions

### Documentation Structure

For components with extensive documentation, organize files in a dedicated folder:

```
docs/ComponentName/
├── README.md          # Main overview and usage
├── API-Reference.md   # Technical reference
├── Examples.md        # Practical examples
└── ...               # Additional specialized docs
```

### Example Template

```markdown
# ComponentName Documentation

## Overview
Brief description of what the component does.

## Installation
Required dependencies and setup.

## Basic Usage
Simple example showing basic implementation.

## Props
Table with all props, types, defaults, required status.

## Advanced Usage
Complex scenarios and customization options.

## Ref Methods
Methods available when using refs.

## Examples
Working code examples.

## Troubleshooting
Common issues and solutions.
```

## Contributing

When adding new components:

1. Create the component in `components/`
2. Add documentation in `docs/ComponentName/` (folder for complex components)
3. Create usage example in `examples/`
4. Update this README with component link
5. Follow the documentation template above

For simple components, a single `docs/ComponentName.md` file is sufficient.
For complex components with multiple aspects, use the folder structure like `PlayerCircle/`.

## Animation Guidelines

For components with animations:

- Use React Native's `Animated` API for performance
- Enable `useNativeDriver: true` when possible
- Document animation timing and easing functions
- Include performance notes in documentation
- Provide examples of animation customization

## Styling Guidelines

For component styling:

- Use StyleSheet.create() for performance
- Make key styles customizable via props
- Document style customization options
- Use consistent naming conventions
- Support both light and dark themes when applicable

## Testing

Each component should include:

- Basic functionality tests
- Animation behavior tests
- Props validation tests
- Ref method tests
- Performance benchmarks (for complex components)

## Support

For questions about components or documentation:

1. Check the component's troubleshooting section
2. Look at the examples directory
3. Review the component source code
4. Create an issue with detailed reproduction steps

---

**Last Updated**: December 2024  
**Version**: 1.0.0