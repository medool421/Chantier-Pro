const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ChantierPro API',
      version: process.env.API_VERSION || 'v1',
      description: 'API documentation for ChantierPro backend',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Local server',
      },
    ],
    components: {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
  schemas: {
    User: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        email: { type: 'string' },
        role: { type: 'string' },
      },
    },
    Project: {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    description: { type: 'string' },
    status: { type: 'string' },
    managerId: { type: 'integer', nullable: true },
  },
},

CreateProjectInput: {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
  },
},

UpdateProjectInput: {
  type: 'object',
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
  },
},

UpdateProjectStatusInput: {
  type: 'object',
  required: ['status'],
  properties: {
    status: { type: 'string' },
  },
},

AssignManagerInput: {
  type: 'object',
  required: ['managerId'],
  properties: {
    managerId: { type: 'integer' },
  },
},

ProjectResponse: {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: { $ref: '#/components/schemas/Project' },
  },
},

ProjectListResponse: {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: { $ref: '#/components/schemas/Project' },
    },
  },
},
Task: {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    title: { type: 'string' },
    description: { type: 'string' },
    status: { type: 'string' },
    projectId: { type: 'integer' },
    assignedTo: { type: 'integer', nullable: true },
  },
},

CreateTaskInput: {
  type: 'object',
  required: ['title'],
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    assignedTo: { type: 'integer' },
  },
},

UpdateTaskInput: {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    assignedTo: { type: 'integer' },
  },
},

UpdateTaskStatusInput: {
  type: 'object',
  required: ['status'],
  properties: {
    status: { type: 'string' },
  },
},

TaskResponse: {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: { $ref: '#/components/schemas/Task' },
  },
},

TaskListResponse: {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: { $ref: '#/components/schemas/Task' },
    },
  },
},
Team: {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
  },
},

CreateTeamInput: {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string' },
  },
},

UpdateTeamInput: {
  type: 'object',
  properties: {
    name: { type: 'string' },
  },
},

AddTeamMemberInput: {
  type: 'object',
  required: ['userId'],
  properties: {
    userId: { type: 'integer' },
  },
},

TeamResponse: {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: { $ref: '#/components/schemas/Team' },
  },
},

TeamListResponse: {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: { $ref: '#/components/schemas/Team' },
    },
  },
},
File: {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    filename: { type: 'string' },
    originalName: { type: 'string' },
    mimeType: { type: 'string' },
    size: { type: 'integer' },
    projectId: { type: 'integer' },
    url: { type: 'string' },
  },
},

FileResponse: {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: { $ref: '#/components/schemas/File' },
  },
},

FileListResponse: {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: { $ref: '#/components/schemas/File' },
    },
  },
},
Report: {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    content: { type: 'string' },
    projectId: { type: 'integer' },
    createdAt: { type: 'string', format: 'date-time' },
  },
},

CreateReportInput: {
  type: 'object',
  required: ['content'],
  properties: {
    content: { type: 'string' },
  },
},

ReportResponse: {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: { $ref: '#/components/schemas/Report' },
  },
},

ReportListResponse: {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: { $ref: '#/components/schemas/Report' },
    },
  },
},

  },
},

    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: [
    './src/routes/*.js',
    './src/models/*.js',
  ],
};

module.exports = swaggerJSDoc(options);