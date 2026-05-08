'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export function SwaggerDocsView() {
  return (
    <div className="swagger-wrapper">
      <SwaggerUI
        url="/api/docs"
        docExpansion="list"
        defaultModelsExpandDepth={-1}
      />
    </div>
  );
}
