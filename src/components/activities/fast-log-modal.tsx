'use client';

import React from 'react';
import { AddActivityModal, AddActivityModalProps } from '@/components/modals/add-activity-modal';

export type FastLogModalProps = AddActivityModalProps;

export function FastLogModal(props: FastLogModalProps) {
  return <AddActivityModal {...props} />;
}
