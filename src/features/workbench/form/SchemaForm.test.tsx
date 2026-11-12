import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { algorithmContent } from '@/content';
import type { OptionsSchema } from '@/domain';
import { fixtureEntries } from '@/test/catalog-entries';
import { matrixFeedback, SchemaForm } from './SchemaForm';
import { initialValues, type FormValues } from './to-options';

function Harness({
  algorithmId,
  schema,
  start,
  errors = {},
}: {
  algorithmId: string;
  schema: OptionsSchema;
  start?: FormValues;
  errors?: Record<string, string>;
}) {
  const [values, setValues] = useState(start ?? initialValues(schema));
  return (
    <>
      <SchemaForm
        algorithmId={algorithmId}
        schema={schema}
        copy={algorithmContent[algorithmId]?.options}
        values={values}
        onChange={setValues}
        errors={errors}
      />
      <output data-testid="values">{JSON.stringify(values)}</output>
    </>
  );
}

const valuesShown = () => JSON.parse(screen.getByTestId('values').textContent ?? '{}');

const schemaOf = async (id: string) => {
  const entry = (await fixtureEntries()).find((e) => e.algorithm?.id === id);
  if (!entry?.algorithm) throw new Error(`no fixture for ${id}`);
  return entry.algorithm.optionsSchema;
};

describe('SchemaForm', () => {
  it('SchemaForm renders the fixture schemas of all 8 algorithms without crashing', async () => {
    const algorithms = (await fixtureEntries()).flatMap((e) => (e.algorithm ? [e.algorithm] : []));
    expect(algorithms).toHaveLength(8);
    for (const algorithm of algorithms) {
      const { unmount } = render(
        <Harness algorithmId={algorithm.id} schema={algorithm.optionsSchema} />,
      );
      unmount();
    }
  });

  it('labels a field from the copy before the schema title, and the help likewise', async () => {
    render(<Harness algorithmId="vigenere" schema={await schemaOf('vigenere')} />);
    const field = screen.getByLabelText('Keyword');
    expect(field).toHaveAccessibleDescription("Letters A–Z only. Case doesn't matter.");
  });

  it('falls back to the schema title and description without copy', async () => {
    render(<Harness algorithmId="unknown" schema={await schemaOf('vigenere')} />);
    expect(screen.getByLabelText('Key')).toHaveAccessibleDescription(
      'Keyword made only of letters (A-Z, case-insensitive), repeated along the text.',
    );
  });

  it('keeps an integer as raw text while typing', async () => {
    const user = userEvent.setup();
    render(<Harness algorithmId="caesar" schema={await schemaOf('caesar')} />);
    await user.type(screen.getByLabelText('Shift'), '-');
    expect(valuesShown()).toEqual({ shift: '-' });
  });

  it('masks the AES password and keeps spaces as typed', async () => {
    const user = userEvent.setup();
    render(<Harness algorithmId="aes-256-gcm" schema={await schemaOf('aes-256-gcm')} />);
    const field = screen.getByLabelText('Password');
    expect(field).toHaveAttribute('type', 'password');
    await user.type(field, ' pass ');
    expect(valuesShown()).toEqual({ key: ' pass ' });
  });

  it('shows the error it is given for a field', async () => {
    render(
      <Harness
        algorithmId="caesar"
        schema={await schemaOf('caesar')}
        errors={{ shift: 'Enter a whole number, like 3 or -1.' }}
      />,
    );
    expect(screen.getByLabelText('Shift')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Enter a whole number, like 3 or -1.')).toBeInTheDocument();
  });

  it('shows the Hill determinant feedback under the matrix', async () => {
    render(
      <Harness
        algorithmId="hill"
        schema={await schemaOf('hill')}
        start={{
          key: [
            [3, 3],
            [2, 5],
          ],
        }}
      />,
    );
    expect(screen.getByText('det(K) = 9 · gcd(9, 26) = 1 ✓ invertible')).toBeInTheDocument();
  });

  it('shows an error on the matrix in place of its feedback', async () => {
    render(
      <Harness
        algorithmId="hill"
        schema={await schemaOf('hill')}
        errors={{ key: 'Must NOT have fewer than 2 items.' }}
      />,
    );
    expect(screen.getByText('Must NOT have fewer than 2 items.')).toBeInTheDocument();
  });

  it('renders the JSON fallback for a schema it does not know, with its error', () => {
    const schema: OptionsSchema = {
      type: 'object',
      properties: { flag: { type: 'boolean', title: 'Flag' } },
      required: ['flag'],
      additionalProperties: false,
    };
    render(<Harness algorithmId="x" schema={schema} errors={{ flag: 'Enter valid JSON.' }} />);
    const field = screen.getByLabelText('Flag');
    expect(field.tagName).toBe('TEXTAREA');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription('Enter valid JSON.');
  });

  it('renders nothing for a schema without options', async () => {
    const { container } = render(
      <SchemaForm
        algorithmId="sha-256"
        schema={await schemaOf('sha-256')}
        values={{}}
        onChange={() => {}}
        errors={{}}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe('matrixFeedback', () => {
  it('matrix feedback for [[2,4],[1,3]] is not ok', () => {
    expect(
      matrixFeedback([
        [2, 4],
        [1, 3],
      ]),
    ).toEqual({ text: 'det(K) = 2 · gcd(2, 26) = 2', ok: false });
  });

  it('marks an invertible key', () => {
    expect(
      matrixFeedback([
        [3, 3],
        [2, 5],
      ]),
    ).toEqual({ text: 'det(K) = 9 · gcd(9, 26) = 1 ✓ invertible', ok: true });
  });
});
