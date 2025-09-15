# Task Completion Checklist

## Before Completing Any Task
1. **Lint Check**: Run `npm run lint` to ensure code quality
2. **Build Check**: Run `npm run build` to verify production build works
3. **Development Test**: Run `npm run dev` to test in development mode

## Code Quality Checks
- Ensure TypeScript types are correct
- Verify all imports are properly resolved
- Check that all images have proper alt text
- Validate responsive design works correctly

## File Organization
- Place images in appropriate directories (`public/picture/` for character images)
- Follow existing naming conventions
- Update relevant documentation if needed

## Testing Workflow
1. Save changes
2. Run linting: `npm run lint`
3. Test development server: `npm run dev`
4. Test production build: `npm run build`
5. Verify functionality in browser

## Common Issues to Check
- Image paths are correct (relative to public directory)
- Tailwind classes are valid
- TypeScript compilation succeeds
- No console errors in browser