import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useModalA11y } from './useModalA11y';

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

interface TestModalProps {
  onClose: () => void;
  isOpen?: boolean;
  dismissable?: boolean;
  label?: string;
  name?: string;
}

function TestModal({ onClose, isOpen = true, dismissable, label, name = 'modal' }: TestModalProps) {
  const { backdropProps, panelProps, titleId } = useModalA11y({ isOpen, onClose, dismissable, label });
  if (!isOpen) return null;
  return (
    <div data-testid={`${name}-backdrop`} {...backdropProps}>
      <div data-testid={`${name}-panel`} {...panelProps}>
        <h2 id={titleId}>Sarlavha</h2>
        <button type="button">{name}-birinchi</button>
        <input aria-label={`${name}-maydon`} />
        <button type="button">{name}-oxirgi</button>
      </div>
    </div>
  );
}

describe('useModalA11y', () => {
  it('dialog semantikasini beradi', () => {
    render(<TestModal onClose={() => {}} />);
    const panel = screen.getByTestId('modal-panel');
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.getAttribute('aria-modal')).toBe('true');
    const labelledBy = panel.getAttribute('aria-labelledby');
    expect(labelledBy && document.getElementById(labelledBy)?.textContent).toBe('Sarlavha');
  });

  it('label berilsa aria-label ishlatadi', () => {
    render(<TestModal onClose={() => {}} label="To'lov" />);
    const panel = screen.getByTestId('modal-panel');
    expect(panel.getAttribute('aria-label')).toBe("To'lov");
    expect(panel.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('ochilganda fokusni birinchi elementga qo\'yadi va scroll\'ni qulflaydi', () => {
    render(<TestModal onClose={() => {}} />);
    expect(document.activeElement).toBe(screen.getByText('modal-birinchi'));
    expect(document.body.classList.contains('modal-open')).toBe(true);
  });

  // Regressiya: avval yopilgach fokus <body> ga tushardi.
  it('yopilganda fokusni ochgan elementga qaytaradi', () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'ochish';
    document.body.appendChild(trigger);
    trigger.focus();

    const { unmount } = render(<TestModal onClose={() => {}} />);
    expect(document.activeElement).not.toBe(trigger);
    unmount();

    expect(document.activeElement).toBe(trigger);
    expect(document.body.classList.contains('modal-open')).toBe(false);
  });

  it('ESC yopadi, dismissable=false bo\'lsa yopmaydi', () => {
    const onClose = vi.fn();
    const { unmount } = render(<TestModal onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();

    const locked = vi.fn();
    render(<TestModal onClose={locked} dismissable={false} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(locked).not.toHaveBeenCalled();
  });

  it('fonda bosilganda yopadi', () => {
    const onClose = vi.fn();
    render(<TestModal onClose={onClose} />);
    const backdrop = screen.getByTestId('modal-backdrop');
    fireEvent.mouseDown(backdrop);
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // Regressiya: `click` mousedown va mouseup ning umumiy ajdodida ishlaydi.
  // Maydondagi matnni tanlab, panel tashqarisida qo'yib yuborish formani
  // butunlay yo'q qilardi.
  it('ichkarida boshlanib tashqarida tugagan sichqoncha harakati yopmaydi', () => {
    const onClose = vi.fn();
    render(<TestModal onClose={onClose} />);
    fireEvent.mouseDown(screen.getByLabelText('modal-maydon'));
    fireEvent.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('panel ichidagi bosish yopmaydi', () => {
    const onClose = vi.fn();
    render(<TestModal onClose={onClose} />);
    const button = screen.getByText('modal-birinchi');
    fireEvent.mouseDown(button);
    fireEvent.click(button);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('Tab fokusni modal ichida aylantiradi', () => {
    render(<TestModal onClose={() => {}} />);
    const first = screen.getByText('modal-birinchi');
    const last = screen.getByText('modal-oxirgi');

    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(first);

    first.focus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('ichma-ich modallarda ESC faqat eng ustkisini yopadi', () => {
    const outer = vi.fn();
    const inner = vi.fn();
    render(<TestModal onClose={outer} name="tashqi" />);
    render(<TestModal onClose={inner} name="ichki" />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
  });

  it('ichma-ich modallarda scroll oxirgisi yopilgandagina ochiladi', () => {
    const outer = render(<TestModal onClose={() => {}} name="tashqi" />);
    const inner = render(<TestModal onClose={() => {}} name="ichki" />);

    inner.unmount();
    expect(document.body.classList.contains('modal-open')).toBe(true);
    outer.unmount();
    expect(document.body.classList.contains('modal-open')).toBe(false);
  });
});
