'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

type LoginToastProps = {
	type: 'error' | 'warning';
	message: string;
};

export const LoginToast = ({ type, message }: LoginToastProps) => {
	useEffect(() => {
		toast[type](message, { id: `login-${type}` });
	}, [type, message]);

	return null;
};
