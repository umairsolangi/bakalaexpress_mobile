import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import { BrandLogo, LOGO_FULL_ASPECT_RATIO, PEPPER_MARK_ASPECT_RATIO } from '../components/BrandLogo';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { brand } from '../theme/brand';

describe('BrandLogo Component (Snapshot-Free)', () => {
  it('renders "full" variant with correct dimensions and image source', () => {
    const width = 200;
    let renderer: ReactTestRenderer.ReactTestRenderer;

    act(() => {
      renderer = ReactTestRenderer.create(
        React.createElement(BrandLogo, { variant: 'full', width, testID: 'full-logo' })
      );
    });

    const tree = renderer!.toJSON() as any;
    expect(tree).toBeDefined();

    // Verify computed dimensions on the rendered view
    const flatStyle = StyleSheet.flatten(tree.props.style);
    expect(flatStyle.width).toBe(width);
    const expectedHeight = width / LOGO_FULL_ASPECT_RATIO;
    expect(flatStyle.height).toBeCloseTo(expectedHeight, 1);

    // Verify accessibility label
    expect(tree.props.accessibilityLabel).toBe('Bakala Express');

    // Child image exists
    expect(tree.children).toBeDefined();
    expect(tree.children.length).toBeGreaterThan(0);

    act(() => {
      renderer.unmount();
    });
  });

  it('renders "mark" variant with height 28dp and proportional mark width', () => {
    const height = 28;
    let renderer: ReactTestRenderer.ReactTestRenderer;

    act(() => {
      renderer = ReactTestRenderer.create(
        React.createElement(BrandLogo, { variant: 'mark', height, testID: 'mark-logo' })
      );
    });

    const tree = renderer!.toJSON() as any;
    expect(tree).toBeDefined();

    const flatStyle = StyleSheet.flatten(tree.props.style);
    expect(flatStyle.height).toBe(height);
    const expectedWidth = height * PEPPER_MARK_ASPECT_RATIO;
    expect(flatStyle.width).toBeCloseTo(expectedWidth, 1);

    act(() => {
      renderer.unmount();
    });
  });
});

describe('Button Theme Integration (Snapshot-Free)', () => {
  it('reads theme.colors.primary and minTapTarget tokens for primary variant', () => {
    const onPress = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    act(() => {
      renderer = ReactTestRenderer.create(
        React.createElement(Button, { title: 'Order Now', onPress, variant: 'primary' })
      );
    });

    const tree = renderer!.toJSON() as any;
    expect(tree).toBeDefined();

    const flatContainerStyle = StyleSheet.flatten(tree.props.style);

    // Must read theme.colors.primary (#005E25 - accessible button green from brand tokens)
    expect(flatContainerStyle.backgroundColor).toBe(theme.colors.primary);
    expect(flatContainerStyle.backgroundColor).toBe(brand.greenDark);

    // Must enforce tap targets >= 48dp
    expect(flatContainerStyle.minHeight).toBe(theme.layout.minTapTarget);
    expect(flatContainerStyle.minHeight).toBeGreaterThanOrEqual(48);

    // Find text node child
    const textChild = tree.children.find((c: any) => typeof c === 'object' && c.type === 'Text');
    expect(textChild).toBeDefined();
    const flatTextStyle = StyleSheet.flatten(textChild.props.style);
    expect(flatTextStyle.color).toBe(theme.colors.textInverse);

    act(() => {
      renderer.unmount();
    });
  });

  it('reads theme.colors.primary for outline button border and text', () => {
    const onPress = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    act(() => {
      renderer = ReactTestRenderer.create(
        React.createElement(Button, { title: 'View Details', onPress, variant: 'outline' })
      );
    });

    const tree = renderer!.toJSON() as any;
    expect(tree).toBeDefined();

    const flatContainerStyle = StyleSheet.flatten(tree.props.style);
    expect(flatContainerStyle.borderColor).toBe(theme.colors.primary);

    const textChild = tree.children.find((c: any) => typeof c === 'object' && c.type === 'Text');
    expect(textChild).toBeDefined();
    const flatTextStyle = StyleSheet.flatten(textChild.props.style);
    expect(flatTextStyle.color).toBe(theme.colors.primary);

    act(() => {
      renderer.unmount();
    });
  });
});
