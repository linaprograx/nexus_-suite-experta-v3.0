import React from 'react';

export const Checkbox: React.FC<{checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, id?: string}> = ({ checked, onChange, id }) => (
    <input type="checkbox" id={id} checked={checked} onChange={onChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600" />
);
