import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * Minimal test to verify the plugin index module loads without throwing.
 * Full component tests will be added in subsequent tasks.
 */
describe('ArgoCD Plugin Scaffold', () => {
  it('index module is importable', async () => {
    // Dynamic import to verify the module parses and exports correctly
    const mod = await import('./index');
    expect(mod).toBeDefined();
  });
});