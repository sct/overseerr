import { Field } from 'formik';
import type React from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  autoApproveColumn: 'Auto-Approve',
  autoDeclineColumn: 'Auto-Decline',
  hdQuality: 'HD',
  fourKQuality: '4K',
  autoApproveDescription: 'Minimum TMDB rating for automatic approval',
  autoDeclineDescription: 'Maximum TMDB rating for automatic decline',
});

interface RatingSettingsTableProps {
  mediaType: 'movie' | 'tv';
  quality?: 'hd' | '4k';
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

const RatingSettingsTable: React.FC<RatingSettingsTableProps> = ({
  mediaType,
  quality,
  errors,
  touched,
}) => {
  const intl = useIntl();

  const getFieldName = (qualityLevel: 'hd' | '4k', type: 'min' | 'max') => {
    const qualitySuffix = qualityLevel === '4k' ? '4k' : '';
    const typeSuffix = type === 'min' ? 'MinRating' : 'MaxRating';
    return `${mediaType}Tmdb${qualitySuffix}${typeSuffix}`;
  };

  const renderQualityRow = (qualityLevel: 'hd' | '4k') => {
    const minFieldName = getFieldName(qualityLevel, 'min');
    const maxFieldName = getFieldName(qualityLevel, 'max');

    return (
      <tr key={qualityLevel}>
        <td className="border border-gray-600 px-4 py-3 text-sm font-medium text-gray-200">
          {qualityLevel === 'hd'
            ? intl.formatMessage(messages.hdQuality)
            : intl.formatMessage(messages.fourKQuality)}
        </td>
        <td className="border border-gray-600 px-4 py-3">
          <Field
            id={minFieldName}
            name={minFieldName}
            type="number"
            step="0.1"
            min="0.1"
            max="10.0"
            className="block w-full rounded-md border-gray-500 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="0.0"
          />
          {errors[minFieldName] && touched[minFieldName] && (
            <div className="mt-2 text-sm text-red-500">
              {errors[minFieldName]}
            </div>
          )}
        </td>
        <td className="border border-gray-600 px-4 py-3">
          <Field
            id={maxFieldName}
            name={maxFieldName}
            type="number"
            step="0.1"
            min="0.1"
            max="10.0"
            className="block w-full rounded-md border-gray-500 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="0.0"
          />
          {errors[maxFieldName] && touched[maxFieldName] && (
            <div className="mt-2 text-sm text-red-500">
              {errors[maxFieldName]}
            </div>
          )}
        </td>
      </tr>
    );
  };

  // If quality is specified, only show that quality level
  if (quality) {
    return (
      <div className="mt-4">
        <table className="min-w-full border-collapse border border-gray-600">
          <thead>
            <tr className="bg-gray-800">
              <th className="border border-gray-600 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                Quality
              </th>
              <th className="border border-gray-600 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                {intl.formatMessage(messages.autoApproveColumn)}
              </th>
              <th className="border border-gray-600 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                {intl.formatMessage(messages.autoDeclineColumn)}
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-900">{renderQualityRow(quality)}</tbody>
        </table>
        <div className="mt-2 text-sm text-gray-400">
          <p>
            <strong>Auto-Approve:</strong>{' '}
            {intl.formatMessage(messages.autoApproveDescription)}
          </p>
          <p>
            <strong>Auto-Decline:</strong>{' '}
            {intl.formatMessage(messages.autoDeclineDescription)}
          </p>
        </div>
      </div>
    );
  }

  // Show both HD and 4K
  return (
    <div className="mt-4">
      <table className="min-w-full border-collapse border border-gray-600">
        <thead>
          <tr className="bg-gray-800">
            <th className="border border-gray-600 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
              Quality
            </th>
            <th className="border border-gray-600 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
              {intl.formatMessage(messages.autoApproveColumn)}
            </th>
            <th className="border border-gray-600 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
              {intl.formatMessage(messages.autoDeclineColumn)}
            </th>
          </tr>
        </thead>
        <tbody className="bg-gray-900">
          {renderQualityRow('hd')}
          {renderQualityRow('4k')}
        </tbody>
      </table>
      <div className="mt-2 text-sm text-gray-400">
        <p>
          <strong>Auto-Approve:</strong>{' '}
          {intl.formatMessage(messages.autoApproveDescription)}
        </p>
        <p>
          <strong>Auto-Decline:</strong>{' '}
          {intl.formatMessage(messages.autoDeclineDescription)}
        </p>
      </div>
    </div>
  );
};

export default RatingSettingsTable;
