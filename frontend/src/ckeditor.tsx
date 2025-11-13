import { useRef, useEffect } from 'react';

import { CKEditor } from '@ckeditor/ckeditor5-react'
import { DecoupledEditor, Alignment, Bold, Editor, Essentials, FullPage, GeneralHtmlSupport, Italic, Paragraph } from 'ckeditor5';
import { Pagination } from 'ckeditor5-premium-features';

import PrintPreview from './plugins/CKEditorPrintPreview';

import 'ckeditor5/ckeditor5.css';
import 'ckeditor5-premium-features/ckeditor5-premium-features.css';

import './index.css';
import './Deed.css';

export function CkEditorRepro() {
    const editorRef = useRef<Editor | null>(null);
    const toolbarRef = useRef<HTMLDivElement | null>(null);
    const editorContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const getDoc = async () => {
            const queryParams = new URLSearchParams(window.location.search);
            const fileName = queryParams.get('file');
            if (!fileName) {
                throw new Error(`File parameter missing. ?file=<file-name> should point to a file in the 'data' directory.`);
            }

            const response = await fetch(`api/?file=${fileName}`);
            const text = await response.text();

            editorRef.current?.setData(text);
        }

        getDoc()
            .catch(err => {
                const errStr = `Error fetching file: ${err}`;
                console.error(errStr);
                editorRef.current?.setData(errStr);
            });
    }, [editorRef]);

    return (<>
        <div className='flex flex-col h-full'>
            <div ref={toolbarRef} id='toolbar-container' className=''></div>
            <div className='flex flex-col overflow-auto'>
                <div ref={editorContainerRef} id='editor-container' className='bg-gray-100'></div>
                <CKEditor<DecoupledEditor> 
                    editor={DecoupledEditor}
                    config={{
                        licenseKey: import.meta.env.VITE_CKEDITOR_LICENSE_KEY,
                        plugins: [Alignment, Bold, Essentials, FullPage, GeneralHtmlSupport, Italic, Pagination, Paragraph, PrintPreview],
                        extraPlugins: [GeneralHtmlSupport],
                        toolbar: {
                            shouldNotGroupWhenFull: true,
                            items: ['heding', '|', 'alignment', 'bold', 'italic', '|', 'printPreview'],
                        },
                        htmlSupport: {
                            allow: [{
                                name: 'img',
                                attributes: ['src', 'alt', 'width', 'height', 'title']
                            }, {
                                classes: true,
                                styles: true,
                            }],

                            // Stuff that should never be in the editor, and potentially poses a risk when dealing with user-supplied content.
                            // (Since our users are internal, this isn't a huge risk, but it's good practice.)
                            disallow: [
                                { name: 'script' },
                                { name: 'iframe' },
                                { name: 'object' },
                                { name: 'embed' },
                                { name: 'link' }, // Avoid CSS
                                { name: /.*/, attributes: [ /^on.*/ ] }, // disallow all event handler attributes
                            ],

                            fullPage: {
                                allowRenderStylesFromHead: true,
                                // Strip unsafe properties and values, for example:
                                // values like url( ... ) that may execute malicious code
                                // from an unknown source.
                                sanitizeCss(cssString: string) {
                                    //const [changed, sanitizedCss] = sanitizeCss(cssString);
                                    return {
                                        css: cssString,
                                        // true or false depending on whether
                                        // the sanitizer stripped anything.
                                        hasChanged: false,
                                    };
                                }
                            }
                        },
                        pagination: {
                            pageWidth: '8.5in',
                            pageHeight: '11in',
                            pageMargins: {
                                top: '0in',
                                bottom: '0in',
                                left: '0in',
                                right: '0in'
                            },
                        },
                    }}
                    onReady={(editor: Editor) => {
                        console.log('CKEditor ready.');

                        editorRef.current = editor;
                        if (!editor.ui.view.toolbar?.element ||
                            !editor.ui.view.editable.element
                        ) {
                            console.error(`CKEditor toolbar and/or editable not present in onReady.`);
                            return;
                        }

                        if (toolbarRef.current) {
                            toolbarRef.current.innerHTML = '';
                            toolbarRef.current?.appendChild(editor.ui.view.toolbar.element);
                        }

                        const editorContainer = document.querySelector('#editor-container');
                        if (editorContainer) {
                            editorContainerRef.current?.appendChild(editor.ui.view.editable.element);
                        }

                        editor.setData('');
                    }}
                />
                {/* Hidden iframe that acts as the print container. Used by the print preview. */}
                <iframe
                    id="print-data-container"
                    title="Print Preview"
                    style={{ display: 'none' }}
                />
            </div>
        </div>
    </>);
}