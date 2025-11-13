import { Plugin, ButtonView } from 'ckeditor5';
import { Locale } from 'ckeditor5';

export default class PrintPreview extends Plugin {
    static get pluginName() {
        return 'PrintPreview';
    }

    init() {
        const editor = this.editor;

        editor.ui.componentFactory.add('printPreview', (locale: Locale) => {
            const button = new ButtonView(locale);

            button.set({
                label: 'P',
                withText: true,
                tooltip: true,
            });

            this.listenTo(button, 'execute', () => {
                const iFrame = document.getElementById('print-data-container') as HTMLIFrameElement | null;
                const win = iFrame?.contentWindow;
                const doc = win?.document;
                if (!win) {
                    console.error('CLOSE THE WINDOW FIRST.') // TODO
                    return;
                }

                if (!doc) {
                    console.warn('PrintPreview: iframe not found or no document.');
                    return;
                }

                const renderPreview = (doc: Document) => {
                    // Clear body
                    doc.body.innerHTML = '';

                    // Clone CKEditor content
                    const contentDiv = doc.createElement('div');
                    contentDiv.classList.add('ck-content'); // make sure editor styles apply
                    contentDiv.classList.add('input[type="radio"]'); // make sure radio buttons look correct... do not know if this actually works or not
                    contentDiv.innerHTML = editor.getData();
                    doc.body.appendChild(contentDiv);

                    // Determine how many stylesheets the print preview needs to load and ensure they're all loaded before showing the
                    // print preview. 
                    const styleSheets = Array.from(document.styleSheets);
                    let totalStyleSheets = styleSheets.filter(ss => ss.href || ss.cssRules).length;
                    let styleSheetsLoaded = 0;

                    const printIfAllLoaded = () => {
                        if (styleSheetsLoaded >= totalStyleSheets) {
                            console.debug('All stylesheets loaded. Displaying print preview...');
                            win.requestAnimationFrame(() => {
                                win.focus();
                                win.print();
                            });
                        } else {
                            console.debug(`Loaded ${styleSheetsLoaded} out of ${totalStyleSheets} stylesheets.`);
                        }
                    };

                    // Copy over stylesheets (CKEditor and app-level styles)
                    Array.from(document.styleSheets).forEach((styleSheet: CSSStyleSheet) => {
                        try {
                            if (styleSheet.href) {
                                // Linked stylesheet
                                const linkEl = doc.createElement('link');
                                linkEl.rel = 'stylesheet';
                                linkEl.href = styleSheet.href;
                                doc.head.appendChild(linkEl);
                                linkEl.onload = () => {
                                    styleSheetsLoaded++;
                                    printIfAllLoaded();
                                }
                            } else if (styleSheet.cssRules) {
                                // Inline <style>
                                const styleEl = doc.createElement('style');
                                Array.from(styleSheet.cssRules).forEach((rule: CSSRule) => {
                                    styleEl.appendChild(doc.createTextNode(rule.cssText));
                                });
                                doc.head.appendChild(styleEl);
                                styleSheetsLoaded++;
                                printIfAllLoaded();
                            }
                        } catch (e) {
                            // Ignore CORS-restricted stylesheets
                            console.warn('Could not access stylesheet:', e);
                            totalStyleSheets++;
                            printIfAllLoaded();
                        }
                    });
                };

                if (doc.readyState === 'loading') {
                    doc.addEventListener('DOMContentLoaded', () => renderPreview(doc));
                } else {
                    renderPreview(doc);
                }
            });

            return button;
        });
    }
};