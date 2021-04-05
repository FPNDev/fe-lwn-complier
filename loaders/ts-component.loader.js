const ts = require('typescript');

module.exports = function (source, map) {
    const file = ts.createSourceFile('x.ts', source, ts.ScriptTarget.Latest);

    const transformerFactory = context => {
        return file => visitChangingDecorators(file, context);
    };

    const transformationResult = ts.transform(file, [transformerFactory]);
    const transformedSourceFile = transformationResult.transformed[0];

    const outSource = ts.createPrinter().printFile(transformedSourceFile);

    this.callback(null, outSource, map);
};

function visitChangingDecorators(node, context) {
    return ts.visitEachChild(
        node,
        child => {
            switch (ts.SyntaxKind[child.kind]) {
                case "ClassDeclaration":
                    return ts.visitEachChild(
                        child,
                        classDeclChild => {
                            return ts.isDecorator(classDeclChild) ? transformComponentDecorator(classDeclChild) : classDeclChild;
                        },
                        context
                    );
            }

            return child;
        },
        context
    );
}

function transformComponentDecorator(decorator) {
    const expr = decorator.expression;
    const decoratorName = expr.expression.escapedText;

    switch (decoratorName) {
        case "Component":
            return ts.updateDecorator(
                decorator,
                ts.updateCall(
                    expr,
                    expr.expression,
                    expr.typeArguments,
                    [transformComponentDecoratorProperties(decorator)]
                )
            );
    }

    return decorator;
}

function transformComponentDecoratorProperties(componentDecorator) {
    const config = componentDecorator.expression.arguments[0];

    const templateProperty = config.properties.find(prop => prop.name.escapedText === 'template');
    const styleProperty = config.properties.find(prop => prop.name.escapedText === 'styles');

    return ts.updateObjectLiteral(config, config.properties.map(property => {
        switch(property.name.escapedText) {
            case 'template':
                return ts.updatePropertyAssignment(
                    property,
                    property.name,
                    ts.createCall(
                        ts.createIdentifier('require'),
                        undefined,
                        [ts.createLiteral(property.initializer.text)]
                    )
                );
            case 'styles':
                return ts.updatePropertyAssignment(
                    property,
                    property.name,
                    ts.createArrayLiteral(property.initializer.elements.map(styleUrl => {
                        return ts.createCall(
                            ts.createIdentifier('require'),
                            undefined,
                            [ts.createLiteral(styleUrl.text)]
                        )
                    }))
                );
                break;
        }

        return property;
    }));
}
