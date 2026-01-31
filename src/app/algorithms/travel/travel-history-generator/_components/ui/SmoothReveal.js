import { Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function SmoothReveal({ show, children }) {
  return (
    <Transition
      show={show}
      as={Fragment}
      enter="transition-all ease-out duration-300"
      enterFrom="opacity-0 -translate-y-2 max-h-0 overflow-hidden"
      enterTo="opacity-100 translate-y-0 max-h-[500px] overflow-visible"
      leave="transition-all ease-in duration-200"
      leaveFrom="opacity-100 translate-y-0 max-h-[500px] overflow-visible"
      leaveTo="opacity-0 -translate-y-2 max-h-0 overflow-hidden"
    >
      <div>{children}</div>
    </Transition>
  );
}
