'use client';

import React from 'react';

interface EditableCellProps {
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    type?: string;
    name: string;
    className?: string;
    options?: string[];
    as?: 'input' | 'textarea';
    placeholder?: string;
}

export const EditableCell: React.FC<EditableCellProps> = ({
    value,
    onChange,
    type = 'text',
    name,
    className,
    options,
    as = 'input',
    placeholder,
}) => {
    const commonClasses = `bg-muted w-full p-1 rounded-md border-input border focus:bg-accent/20 focus:ring-1 focus:ring-ring focus:outline-none text-foreground ${className}`;

    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useLayoutEffect(() => {
        if (as === 'textarea' && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [value, as]);

    if (as === 'textarea') {
        return (
            <textarea
                ref={textareaRef}
                name={name}
                value={value}
                onChange={onChange}
                className={`${commonClasses} resize-none overflow-hidden`}
                aria-label={`Editable textarea for ${name}`}
                placeholder={placeholder}
                rows={1}
            />
        );
    }

    if (type === 'select' && options) {
        return (
            <select
                name={name}
                value={value}
                onChange={onChange}
                className={commonClasses}
                aria-label={`Editable select for ${name}`}
            >
                {options.map((opt) => (
                    <option key={opt} value={opt} className="bg-popover text-popover-foreground">
                        {opt}
                    </option>
                ))}
            </select>
        );
    }

    return (
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className={commonClasses}
            aria-label={`Editable cell for ${name} with value ${value}`}
            placeholder={placeholder}
        />
    );
};
