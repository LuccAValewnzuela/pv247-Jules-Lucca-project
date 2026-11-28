'use client';

import { Ellipsis } from 'lucide-react';
import Link from 'next/link';
import {
	useActionState,
	useCallback,
	useEffect,
	useRef,
	useState
} from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import { FormAlert } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { SessionType } from '@/db/schema';
import { initialSessionTypeActionState } from '@/lib/session-types';
import { toggleSessionTypeActive } from '@/server/session-type-actions';

type SessionTypeActionsProps = {
	sessionType: Pick<SessionType, 'id' | 'isActive'>;
};

type MenuPosition = {
	top: number;
	right: number;
};

export const SessionTypeActions = ({
	sessionType
}: SessionTypeActionsProps) => {
	const [open, setOpen] = useState(false);
	const [position, setPosition] = useState<MenuPosition>({ top: 0, right: 0 });
	const triggerRef = useRef<HTMLButtonElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const [state, formAction, pending] = useActionState(
		toggleSessionTypeActive,
		initialSessionTypeActionState
	);

	const menuId = `session-type-actions-${sessionType.id}`;

	const updatePosition = useCallback(() => {
		const rect = triggerRef.current?.getBoundingClientRect();
		if (!rect) return;

		const next = {
			top: rect.bottom + 4,
			right: document.documentElement.clientWidth - rect.right
		};

		setPosition(current =>
			current.top === next.top && current.right === next.right ? current : next
		);
	}, []);

	const toggleMenu = () => {
		if (!open) updatePosition();
		setOpen(value => !value);
	};

	useEffect(() => {
		if (!open) return;

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target;
			if (
				target instanceof Node &&
				(triggerRef.current?.contains(target) ||
					menuRef.current?.contains(target))
			) {
				return;
			}

			setOpen(false);
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;

			setOpen(false);
			triggerRef.current?.focus();
		};

		window.addEventListener('scroll', updatePosition, true);
		window.addEventListener('resize', updatePosition);
		document.addEventListener('pointerdown', handlePointerDown);
		document.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('scroll', updatePosition, true);
			window.removeEventListener('resize', updatePosition);
			document.removeEventListener('pointerdown', handlePointerDown);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [open, updatePosition]);

	return (
		<>
			<Button
				ref={triggerRef}
				type="button"
				variant="ghost"
				size="icon"
				onClick={toggleMenu}
				aria-expanded={open}
				aria-controls={open ? menuId : undefined}
			>
				<Ellipsis />
			</Button>

			{open &&
				createPortal(
					<div
						id={menuId}
						ref={menuRef}
						style={{
							position: 'fixed',
							top: position.top,
							right: position.right
						}}
						className="z-50 flex min-w-36 flex-col rounded-md border border-gray-200 bg-white p-1 shadow-lg"
					>
						<Button asChild variant="ghost" size="sm" className="justify-start">
							<Link href={`/dashboard/session-types/${sessionType.id}`}>
								Edit
							</Link>
						</Button>

						<form action={formAction}>
							<Input type="hidden" name="id" value={sessionType.id} />
							<Button
								type="submit"
								variant={sessionType.isActive ? 'destructive' : 'ghost'}
								size="sm"
								disabled={pending}
								className="w-full justify-start"
							>
								{pending
									? 'Saving...'
									: sessionType.isActive
										? 'Deactivate'
										: 'Activate'}
							</Button>
						</form>
						<FormAlert message={state.message} className="px-2 pb-1 text-xs" />
					</div>,
					document.body
				)}
		</>
	);
};
