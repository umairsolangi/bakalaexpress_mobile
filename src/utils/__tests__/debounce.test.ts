import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { useDebounce } from '../debounce';

function TestComponent({ value, delay }: { value: string; delay?: number }) {
  const debounced = useDebounce(value, delay);
  return React.createElement(Text, { testID: 'debounced-text' }, debounced);
}

describe('useDebounce Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('delays updating value until debounce delay has elapsed', () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        React.createElement(TestComponent, { value: 'initial', delay: 400 })
      );
    });

    const textNode = renderer.root.findByProps({ testID: 'debounced-text' });
    expect(textNode.props.children).toBe('initial');

    // Update value prop
    act(() => {
      renderer.update(
        React.createElement(TestComponent, { value: 'updated', delay: 400 })
      );
    });

    // Before 400ms passes, it should still be 'initial'
    expect(textNode.props.children).toBe('initial');

    // Advance 200ms
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(textNode.props.children).toBe('initial');

    // Advance remaining 200ms
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(textNode.props.children).toBe('updated');
  });
});
