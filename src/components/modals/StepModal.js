"use client";

import styles from "@/styles/modal.module.css";

export default function StepModal({ step, onNext, onPrev }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.stepModal}>
        <h3 className={styles.modalTitle}>Step {step}</h3>
        <div className={styles.modalContent}>
          {step === 1 && (
            <>
              <p>Step 1: Enter recipient address and amount.</p>
              <button onClick={onNext}>Next</button>
            </>
          )}
          {step === 2 && (
            <>
              <p>Step 2: Review your transaction details.</p>
              <button onClick={onPrev}>Previous</button>
              <button onClick={onNext}>Next</button>
            </>
          )}
          {step === 3 && (
            <>
              <p>Step 3: Confirm the transaction.</p>
              <button onClick={onPrev}>Previous</button>
              <button onClick={onNext}>Complete</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
